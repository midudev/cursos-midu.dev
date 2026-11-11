// Servidor del curso: sirve las lecciones y hace de proxy a la Decisions API.
// La API key se queda aquí (en .env) y nunca llega al navegador.
//
//   node server.js          → http://localhost:3000
//   PORT=4000 node server.js
import { createServer } from 'node:http'
import { existsSync } from 'node:fs'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize, sep } from 'node:path'

if (existsSync('.env')) process.loadEnvFile('.env')

const PORT = Number(process.env.PORT) || 3000
const ROOT = join(import.meta.dirname, 'lecciones')
const API = 'https://api.openai.com/v1/decisions'

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
}

const dim = (s) => `\x1b[2m${s}\x1b[0m`
const color = (code) => (s) => `\x1b[${code}m${s}\x1b[0m`
const green = color(32)
const red = color(31)

function sendJSON (res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(body))
}

async function readBody (req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  return Buffer.concat(chunks).toString('utf8')
}

// POST /v1/decisions → https://api.openai.com/v1/decisions
async function proxy (req, res) {
  const key = process.env.OPENAI_API_KEY
  if (!key) {
    return sendJSON(res, 500, {
      error: { message: 'Falta OPENAI_API_KEY en el archivo .env', type: 'server_error' }
    })
  }

  const body = await readBody(req)
  const t0 = performance.now()
  let upstream
  try {
    upstream = await fetch(API, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
      body
    })
  } catch (err) {
    console.log(red(`✗ POST /v1/decisions · ${err.message}`))
    return sendJSON(res, 502, { error: { message: `No se pudo conectar con OpenAI: ${err.message}`, type: 'network_error' } })
  }

  const text = await upstream.text()
  const ms = Math.round(performance.now() - t0)

  // Log legible para tenerlo en pantalla mientras se graba
  let summary = ''
  try {
    const q = JSON.parse(body).questions
    const r = JSON.parse(text)
    summary = r.error
      ? r.error.message
      : `${q?.length ?? 0} pregunta${q?.length === 1 ? '' : 's'} · ${r.usage?.input_tokens ?? '?'} tokens` +
        (r.usage?.input_tokens_details?.cached_tokens ? ` (${r.usage.input_tokens_details.cached_tokens} en caché)` : '')
  } catch {}
  const paint = upstream.ok ? green : red
  console.log(`${paint(`${upstream.ok ? '✓' : '✗'} POST /v1/decisions ${upstream.status}`)} ${dim(`· ${ms} ms ·`)} ${summary}`)

  res.writeHead(upstream.status, {
    'content-type': upstream.headers.get('content-type') ?? 'application/json',
    'x-decision-ms': String(ms)
  })
  res.end(text)
}

async function serveStatic (req, res) {
  const url = new URL(req.url, 'http://localhost')
  let path = decodeURIComponent(url.pathname)
  if (path === '/') {
    res.writeHead(302, { location: '/lecciones/' })
    return res.end()
  }
  if (path === '/favicon.ico') {
    res.writeHead(204)
    return res.end()
  }
  if (!path.startsWith('/lecciones')) return sendJSON(res, 404, { error: 'not found' })

  const urlPath = path
  path = normalize(join(ROOT, path.slice('/lecciones'.length)))
  if (path !== ROOT && !path.startsWith(ROOT + sep)) return sendJSON(res, 403, { error: 'forbidden' })

  try {
    if ((await stat(path)).isDirectory()) {
      // Sin la barra final, las rutas relativas (assets/lesson.css) apuntarían a la raíz
      if (!urlPath.endsWith('/')) {
        res.writeHead(301, { location: `${urlPath}/${url.search}` })
        return res.end()
      }
      path = join(path, 'index.html')
    }
    const data = await readFile(path)
    res.writeHead(200, { 'content-type': TYPES[extname(path)] ?? 'application/octet-stream', 'cache-control': 'no-store' })
    res.end(data)
  } catch {
    sendJSON(res, 404, { error: 'not found' })
  }
}

createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/v1/decisions') return proxy(req, res)
  if (req.method === 'GET' || req.method === 'HEAD') return serveStatic(req, res)
  sendJSON(res, 405, { error: 'method not allowed' })
}).listen(PORT, '127.0.0.1', () => {
  console.log(`\n  Decisions API · lecciones  →  ${green(`http://localhost:${PORT}`)}`)
  console.log(dim(`  API key: ${process.env.OPENAI_API_KEY ? 'cargada desde .env' : red('NO ENCONTRADA (.env)')}\n`))
})
