// Ejecuta la solución de cada lección contra la API real y guarda las
// respuestas como mocks dentro del HTML (<script type="application/json" id="mock">).
//
//   node scripts/comprobar.mjs            → todas las lecciones
//   node scripts/comprobar.mjs 03 05      → solo esas
//   node scripts/comprobar.mjs --no-mocks → comprueba sin reescribir los mocks
import { existsSync } from 'node:fs'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const ROOT = join(import.meta.dirname, '..')
const DIR = join(ROOT, 'lecciones')
const FILES = join(DIR, 'assets', 'files')

if (existsSync(join(ROOT, '.env'))) process.loadEnvFile(join(ROOT, '.env'))
if (!process.env.OPENAI_API_KEY) {
  console.error('Falta OPENAI_API_KEY en .env')
  process.exit(1)
}

const args = process.argv.slice(2)
const writeMocks = !args.includes('--no-mocks')
const only = args.filter((a) => /^\d\d$/.test(a))

const BLANK = /^(\s*)(.*?)\s*\/\/__\s*(.*?)\s*$/
const IMPORT = /^\s*import\s+[\s\S]*?\s+from\s+["'](openai|node:fs\/promises|fs\/promises)["'];?[ \t]*$/gm
const EXERCISE = /<script type="text\/plain" id="exercise"[^>]*>([\s\S]*?)<\/script>/
const MOCK = /\n?<script type="application\/json" id="mock">[\s\S]*?<\/script>/

function solution (source) {
  return source
    .replace(/^\s*\n/, '')
    .replace(/\s+$/, '')
    .split('\n')
    .map((line) => {
      const m = line.match(BLANK)
      return m ? m[1] + m[2] : line
    })
    .join('\n')
}

async function runLesson (file) {
  const html = await readFile(join(DIR, file), 'utf8')
  const code = solution(html.match(EXERCISE)[1]).replace(IMPORT, '')
  const responses = []
  const logs = []

  class OpenAI {
    decisions = {
      create: async (body) => {
        const i = responses.length
        responses.push(null)
        const res = await fetch('https://api.openai.com/v1/decisions', {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
          body: JSON.stringify(body)
        })
        const json = await res.json()
        if (!res.ok) throw new Error(`${res.status} ${json.error?.message}`)
        responses[i] = json
        return json
      }
    }
  }

  const readLocal = (path, encoding) => readFile(join(FILES, String(path).replace(/^\.?\//, '')), encoding)
  const fmt = (a) => (typeof a === 'string' ? a : JSON.stringify(a))
  const capture = (...a) => logs.push(a.map(fmt).join(' '))
  const fakeConsole = { log: capture, info: capture, warn: capture, error: capture, table: capture }

  const AsyncFunction = (async () => {}).constructor
  const t0 = performance.now()
  await new AsyncFunction('OpenAI', 'readFile', 'console', 'process', code)(OpenAI, readLocal, fakeConsole, { env: {} })
  const ms = Math.round(performance.now() - t0)

  if (writeMocks) {
    const mock = `<script type="application/json" id="mock">${JSON.stringify(responses)}</script>`
    const next = MOCK.test(html)
      ? html.replace(MOCK, '\n' + mock)
      : html.replace('<script src="assets/highlight.js">', `${mock}\n<script src="assets/highlight.js">`)
    await writeFile(join(DIR, file), next)
  }
  return { responses, logs, ms }
}

const files = (await readdir(DIR))
  .filter((f) => /^\d\d-.*\.html$/.test(f))
  .filter((f) => !only.length || only.includes(f.slice(0, 2)))
  .sort()

let failed = 0
for (const file of files) {
  try {
    const { responses, logs, ms } = await runLesson(file)
    console.log(`\x1b[32m✓\x1b[0m ${file} \x1b[2m· ${responses.length} petición(es) · ${ms} ms\x1b[0m`)
    for (const l of logs) console.log(`    ${l.length > 160 ? l.slice(0, 160) + '…' : l}`)
  } catch (err) {
    failed++
    console.log(`\x1b[31m✗ ${file}\x1b[0m ${err.message}`)
  }
}
process.exit(failed ? 1 : 0)
