/* ──────────────────────────────────────────────────────────────
   Lecciones · editor con huecos que se ejecuta de verdad
   - Lee el ejercicio de <script type="text/plain" id="exercise">
   - Las líneas que terminan en  //__ pista  son huecos a rellenar
   - Las líneas que terminan en  //~ clave  tienen un string editable:
     no cuenta para la solución y se pinta en [data-edit="clave"]
     del escenario (si hay varias líneas con la misma clave, se concatenan).
     Con data-edit-attr="src" cambia ese atributo en vez del texto, y
     data-edit-base="assets/files/" se antepone si no es una URL
   - Otros <script type="text/plain" data-file="x.js"> son ficheros de
     contexto: salen como pestañas de solo lectura y no se ejecutan
   - "Ejecutar" corre tu código: `new OpenAI()` y `readFile()` son
     versiones para el navegador que llaman al proxy local
     (server.js → POST https://api.openai.com/v1/decisions)
   - Cada lección pinta el resultado con window.renderStage(state)
   ────────────────────────────────────────────────────────────── */
(() => {
  'use strict'

  const LESSONS = [
    { n: '00', href: '00-predicate.html', label: 'predicate' },
    { n: '01', href: '01-choice.html', label: 'choice' },
    { n: '02', href: '02-score.html', label: 'score' },
    { n: '03', href: '03-multiple.html', label: 'varias' },
    { n: '04', href: '04-thresholds.html', label: 'umbrales' },
    { n: '05', href: '05-images.html', label: 'imágenes' },
    { n: '06', href: '06-reference.html', label: 'referencia' },
    { n: '07', href: '07-json.html', label: 'json' },
    { n: '08', href: '08-tools.html', label: 'tools' },
    { n: '09', href: '09-cache.html', label: 'caché' },
    { n: '10', href: '10-project.html', label: 'proyecto' }
  ]

  const ENDPOINT = '/v1/decisions'
  const BLANK = /^(\s*)(.*?)\s*\/\/__\s*(.*?)\s*$/
  const EDIT = /^(.*?)\s*\/\/~\s*(\S*)\s*$/
  const STRING = /(["'`])((?:\\.|(?!\1)[^\\])*)\1/
  const LOCK_ICON = '<svg class="lock" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="16" height="11" x="4" y="11" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>'
  const FILE_ICON = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3.5 1.5h6l3 3v10h-9z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/><path d="M9.5 1.5v3h3" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>'

  const icon = (paths) => `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`
  const ICONS = {
    hints: icon('<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>'),
    console: icon('<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 15h18"/><path class="fill" d="M4 16h16v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" fill="currentColor" stroke="none"/>'),
    reset: icon('<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>'),
    solve: icon('<path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0"/><circle cx="12" cy="12" r="3"/>'),
    run: icon('<path d="M6 3.5v17a.5.5 0 0 0 .76.43l14-8.5a.5.5 0 0 0 0-.86l-14-8.5A.5.5 0 0 0 6 3.5z" fill="currentColor"/>'),
    hide: icon('<path d="m6 9 6 6 6-6"/>'),
    focus: icon('<path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/>'),
    restore: icon('<path d="M4 14h6v6"/><path d="M20 10h-6V4"/><path d="M14 10l7-7"/><path d="M3 21l7-7"/>')
  }

  const params = new URLSearchParams(location.search)
  const MOCK = params.has('mock')

  // Hueco para la cámara (abajo a la derecha): ?cam=400x300 · ?cam=0 lo quita · ?guia lo enseña
  const cam = params.get('cam')
  if (cam === '0') document.documentElement.classList.add('no-cam')
  else if (/^\d+x\d+$/.test(cam ?? '')) {
    const [w, h] = cam.split('x')
    document.documentElement.style.setProperty('--cam-w', `${w}px`)
    document.documentElement.style.setProperty('--cam-h', `${h}px`)
  }
  if (params.has('guia')) document.documentElement.classList.add('cam-guide')

  // Consola plegable: al ocultarla, el editor ocupa todo el alto. Se recuerda entre lecciones.
  const CONSOLE_KEY = 'lecciones:consola-oculta'
  let consoleHidden = localStorage.getItem(CONSOLE_KEY) === '1'
  document.documentElement.classList.toggle('no-console', consoleHidden)

  // Solo el código: oculta cabecera, lecciones, reto y consola. También se recuerda.
  const FOCUS_KEY = 'lecciones:solo-codigo'
  let focusCode = localStorage.getItem(FOCUS_KEY) === '1'
  document.documentElement.classList.toggle('focus-code', focusCode)

  const panel = document.querySelector('.panel')
  const stage = document.querySelector('.stage')
  const source = document.getElementById('exercise')
  const extraFiles = [...document.querySelectorAll('script[type="text/plain"][data-file]:not(#exercise)')]
    .map((el) => ({ name: el.dataset.file, code: el.textContent.replace(/^\s*\n/, '').replace(/\s+$/, '') }))
  const mocks = JSON.parse(document.getElementById('mock')?.textContent || '[]')
  const current = document.body.dataset.lesson
  const lesson = LESSONS.find((l) => l.n === current) ?? LESSONS[0]
  const mod = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl'

  // ─── Parseo del ejercicio ───
  let count = 0
  const lines = source.textContent
    .replace(/^\s*\n/, '')
    .replace(/\s+$/, '')
    .split('\n')
    .map((text) => {
      const e = text.match(EDIT)
      const s = e?.[1].match(STRING)
      if (s) {
        const value = unquote(s[2], s[1])
        const before = e[1].slice(0, s.index)
        const after = e[1].slice(s.index + s[0].length)
        return { text: e[1], edit: { key: e[2], quote: s[1], before, after, value, original: value } }
      }
      const m = text.match(BLANK)
      if (!m) return { text: e ? e[1] : text }
      return { blank: ++count, indent: m[1], solution: m[2], hint: m[3], value: '' }
    })
  const blanks = lines.filter((l) => l.blank)
  const edits = lines.filter((l) => l.edit)

  function unquote (raw, q) {
    if (q === '"') try { return JSON.parse(`"${raw}"`) } catch {}
    return raw.replace(/\\(.)/g, '$1')
  }

  // De vuelta a un literal válido: lo que escribas no rompe el código
  function quote (value, q) {
    let s = value.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').split(q).join(`\\${q}`)
    if (q === '`') s = s.replace(/\$\{/g, '\\${')
    return q + s + q
  }

  const editCode = ({ edit }) => edit.before + quote(edit.value, edit.quote) + edit.after

  // Pares que abren y cierran en la misma línea de la solución
  for (const line of blanks) {
    const count = (c) => line.solution.split(c).length - 1
    line.balanced = new Set(['(', '[', '{'].filter((o) => count(o) === count({ '(': ')', '[': ']', '{': '}' }[o])))
  }

  // La coma final es opcional si la siguiente línea cierra el objeto/array
  lines.forEach((line, i) => {
    if (!line.blank || !line.solution.endsWith(',')) return
    const next = lines.slice(i + 1).find((l) => (l.blank ? l.solution : l.text).trim())
    const nextText = next ? (next.blank ? next.solution : next.text).trim() : ''
    line.optionalComma = /^[}\])]/.test(nextText)
  })

  // ─── Panel ───
  const goal = panel.querySelector('.goal')?.outerHTML ?? ''
  const explain = panel.querySelector('.explain')?.outerHTML ?? ''

  panel.innerHTML = `
    <header class="panel-top">
      <span class="logo" aria-hidden="true"></span>
      <a class="crumb" href="./">Lecciones</a>
      <span class="sep">/</span>
      <span>${lesson.n} · ${lesson.label}</span>
      ${MOCK ? '<span class="support"><b class="mock">modo mock</b></span>' : ''}
    </header>
    <nav class="panel-nav" aria-label="Lecciones">
      ${LESSONS.map((l) => `<a class="nav-item" href="${l.href}${MOCK ? '?mock' : ''}"${l.n === current ? ' aria-current="page"' : ''}><b>${l.n}</b>${l.label}</a>`).join('')}
    </nav>
    <div class="panel-code">
      <div class="exercise">
        ${goal}
        <div class="code-frame">
          <div class="code-head">
            ${extraFiles.length
              ? `<div class="tabs files" role="tablist" aria-label="Ficheros">
                  <button type="button" role="tab" data-file-tab="0" aria-selected="true">${FILE_ICON}<span class="name">${source.dataset.file}</span></button>
                  ${extraFiles.map((f, i) => `<button type="button" role="tab" data-file-tab="${i + 1}" aria-selected="false" title="Solo lectura: no se ejecuta">${FILE_ICON}<span class="name">${f.name}</span>${LOCK_ICON}</button>`).join('')}
                </div>`
              : `${FILE_ICON}<span class="name">${source.dataset.file}</span>`}
            <span class="score" aria-live="polite"><b>0</b>/${blanks.length}</span>
            <button class="btn btn-icon" type="button" data-action="hints" aria-pressed="true" aria-label="Pistas" data-tip="Ocultar pistas">${ICONS.hints}</button>
            <button class="btn btn-icon" type="button" data-action="console" aria-pressed="${!consoleHidden}" aria-label="Consola" data-tip="${consoleHidden ? 'Mostrar' : 'Ocultar'} consola">${ICONS.console}</button>
            <button class="btn btn-icon" type="button" data-action="focus" aria-pressed="${focusCode}" aria-label="Solo el código" data-tip="${focusCode ? 'Mostrar todo' : 'Solo el código'}">${focusCode ? ICONS.restore : ICONS.focus}</button>
            <button class="btn btn-icon" type="button" data-action="reset" aria-label="Reiniciar" data-tip="Reiniciar">${ICONS.reset}</button>
            <button class="btn btn-icon" type="button" data-action="solve" aria-label="Ver solución" data-tip="Ver solución">${ICONS.solve}</button>
            <button class="btn btn-icon btn-run" type="button" data-action="run" aria-label="Ejecutar" data-tip="Ejecutar · ${mod}S">${ICONS.run}</button>
          </div>
          <div class="editor"><div class="editor-lines" data-file-pane="0"></div>${extraFiles.map((_, i) => `<div class="editor-lines readonly" data-file-pane="${i + 1}" hidden></div>`).join('')}</div>
        </div>
        <div class="dock">
        <div class="dock-main">
        <div class="out-frame">
          <div class="out-head">
            <div class="tabs" role="tablist">
              <button type="button" role="tab" data-tab="console" aria-selected="true">Consola</button>
              <button type="button" role="tab" data-tab="request" aria-selected="false">Petición</button>
              <button type="button" role="tab" data-tab="response" aria-selected="false">Respuesta</button>
            </div>
            <span class="calls"></span>
            <span class="out-status" aria-live="polite"></span>
            <button class="btn btn-icon btn-ghost" type="button" data-action="console" aria-label="Ocultar consola" data-tip="Ocultar consola">${ICONS.hide}</button>
          </div>
          <div class="out-body"></div>
        </div>
        ${explain}
        <p class="keys">
          <span><kbd>↵</kbd> siguiente</span>
          <span><kbd>${mod}</kbd><kbd>↵</kbd> revelar</span>
          <span><kbd>${mod}</kbd><kbd>S</kbd> ejecutar</span>
        </p>
        </div>
        <div class="cam" aria-hidden="true"></div>
        </div>
      </div>
    </div>
  `

  const frame = panel.querySelector('.code-frame')
  const editor = panel.querySelector('.editor')
  const root = panel.querySelector('.editor-lines')
  const score = panel.querySelector('.score b')
  const hintsBtn = panel.querySelector('[data-action="hints"]')
  const outBody = panel.querySelector('.out-body')
  const outStatus = panel.querySelector('.out-status')
  const callsEl = panel.querySelector('.calls')
  const tabs = panel.querySelectorAll('[data-tab]')

  // ─── Líneas del editor ───
  for (const line of lines) {
    const el = document.createElement('div')
    el.className = 'line'
    // sangría de la línea: las continuaciones del wrap se alinean con ella
    el.style.setProperty('--indent', `${(line.blank ? line.indent : line.text.match(/^\s*/)[0]).length}ch`)
    if (line.blank) {
      el.classList.add('blank')
      el.innerHTML = `${line.indent}<span class="slot"><span class="slot-hl"></span><input type="text" spellcheck="false" autocomplete="off" autocapitalize="off" autocorrect="off"></span>`
      line.input = el.querySelector('input')
      line.hl = el.querySelector('.slot-hl')
      line.input.dataset.blank = line.blank
      line.input.setAttribute('aria-label', `Hueco ${line.blank}: ${line.hint}`)
      el.addEventListener('mousedown', (e) => {
        if (e.target === line.input) return
        e.preventDefault()
        focusBlank(line.blank - 1)
      })
    }
    line.el = el
    root.append(el)
  }

  // ─── Render del editor ───
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

  const paint = (tokens) => tokens
    .map(({ content, color }) => (!color || color === 'var(--shiki-foreground)' || !content.trim())
      ? esc(content)
      : `<span style="color:${color}">${esc(content)}</span>`)
    .join('')

  const skip = (tokens, n) => {
    const out = []
    for (const t of tokens) {
      if (n >= t.content.length) { n -= t.content.length; continue }
      out.push({ ...t, content: t.content.slice(n) })
      n = 0
    }
    return out
  }

  const norm = (s) => s
    .trim()
    .replace(/['`]/g, '"')
    .replace(/\s+/g, ' ')
    .replace(/\s*([:;,(){}[\]=<>+\-*/.!?&|])\s*/g, '$1')
    .replace(/;+$/, '')

  const isCorrect = (line) => {
    const v = norm(line.value)
    const s = norm(line.solution)
    return v === s || (line.optionalComma && v === s.replace(/,$/, ''))
  }

  const assemble = () => lines.map((l) => (l.blank ? l.indent + l.value : l.edit ? editCode(l) : l.text)).join('\n')
  const highlight = (code, lang = 'js') => {
    const fn = lang === 'json' ? window.highlightJSON : window.highlightJS
    return typeof fn === 'function' ? fn(code) : code.split('\n').map((content) => [{ content }])
  }

  // Tokens entre dos columnas de la línea
  const cut = (tokens, from, to = Infinity) => {
    const out = []
    let pos = 0
    for (const t of tokens) {
      const a = Math.max(from, pos)
      const b = Math.min(to, pos + t.content.length)
      if (b > a) out.push({ ...t, content: t.content.slice(a - pos, b - pos) })
      pos += t.content.length
    }
    return out
  }

  // Las líneas con string editable se pintan una sola vez: el texto del
  // string es un contenteditable y el resto de la línea no cambia
  const sourceTokens = highlight(lines.map((l) => (l.blank ? l.indent + l.solution : l.text)).join('\n'))
  for (const line of edits) {
    const tokens = sourceTokens[lines.indexOf(line)] ?? []
    const open = line.edit.before.length + 1
    const close = line.text.length - line.edit.after.length - 1
    line.el.classList.add('editable')
    line.el.innerHTML = paint(cut(tokens, 0, open)) +
      `<span class="edit" contenteditable="plaintext-only" spellcheck="false" role="textbox" title="Cámbialo: no afecta a la solución" aria-label="Texto editable, no afecta a la solución">${esc(line.edit.value)}</span>` +
      paint(cut(tokens, close))
    line.edit.el = line.el.querySelector('.edit')
  }

  // ─── Ficheros de solo lectura (pestañas) ───
  const panes = [...editor.querySelectorAll('[data-file-pane]')]
  extraFiles.forEach((f, i) => {
    panes[i + 1].innerHTML = highlight(f.code)
      .map((tokens, n) => {
        const indent = f.code.split('\n')[n].match(/^\s*/)[0].length
        return `<div class="line" style="--indent:${indent}ch">${paint(tokens)}</div>`
      })
      .join('')
  })

  let file = 0
  const scrollOf = panes.map(() => 0)
  function showFile (i) {
    if (i === file || !panes[i]) return
    scrollOf[file] = editor.scrollTop
    file = i
    panes.forEach((p, n) => { p.hidden = n !== i })
    panel.querySelectorAll('[data-file-tab]').forEach((t) => t.setAttribute('aria-selected', String(Number(t.dataset.fileTab) === i)))
    frame.classList.toggle('is-readonly', i > 0)
    editor.scrollTop = scrollOf[i]
  }

  let done = false
  function render () {
    const code = assemble()
    const tokens = highlight(code)

    let ok = 0
    lines.forEach((line, i) => {
      const lineTokens = tokens[i] ?? []
      if (line.edit) return
      if (!line.blank) {
        line.el.innerHTML = paint(lineTokens)
        return
      }
      const filled = line.value.length > 0
      const correct = filled && isCorrect(line)
      if (correct) ok++
      line.hl.innerHTML = filled
        ? paint(skip(lineTokens, line.indent.length)) + ' '
        : `<span class="ghost">${esc(ghost(line))}</span>`
      line.el.classList.toggle('is-ok', correct)
    })

    score.textContent = ok
    const wasDone = done
    done = ok === blanks.length
    frame.classList.toggle('is-done', done)
    // al completar todos los huecos, se ejecuta solo (una vez por versión del código)
    if (done && !wasDone) scheduleAutoRun()
  }

  const ghost = (line) => hintsBtn.getAttribute('aria-pressed') === 'true'
    ? `// ${line.blank} · ${line.hint}`
    : `// ${line.blank}`

  // ─── Edición ───
  function focusBlank (i) {
    const line = blanks[i]
    if (!line) return
    line.input.focus({ preventScroll: true })
    const top = line.el.offsetTop
    const bottom = top + line.el.offsetHeight
    if (top < editor.scrollTop + 12) editor.scrollTop = top - 12
    else if (bottom > editor.scrollTop + editor.clientHeight - 12) editor.scrollTop = bottom - editor.clientHeight + 12
  }

  function fill (line, value) {
    line.value = value
    line.input.value = value
  }

  // Autocierre de paréntesis, llaves y comillas (como en un editor de verdad)
  const PAIRS = { '(': ')', '[': ']', '{': '}', '"': '"', "'": "'", '`': '`' }
  const CLOSERS = new Set(Object.values(PAIRS))
  const QUOTES = new Set(['"', "'", '`'])

  root.addEventListener('beforeinput', (e) => {
    const input = e.target
    if (!input.dataset?.blank || e.inputType !== 'insertText' || e.data?.length !== 1) return
    const { selectionStart: start, selectionEnd: end, value } = input
    const ch = e.data

    if (CLOSERS.has(ch) && start === end && value[start] === ch) {
      e.preventDefault()
      input.setSelectionRange(start + 1, start + 1)
      return
    }
    // las comillas solo se cierran solas si no estás pegado a una palabra
    if (QUOTES.has(ch) && start === end && /\w/.test(value[start - 1] ?? '')) return
    // si la línea abre un bloque que se cierra más abajo (p. ej. "create({"), no autocierres
    const line = blanks[input.dataset.blank - 1]
    if (PAIRS[ch] && !QUOTES.has(ch) && !line.balanced.has(ch)) return
    if (PAIRS[ch]) {
      e.preventDefault()
      const inner = value.slice(start, end)
      input.setRangeText(ch + inner + PAIRS[ch], start, end)
      const caret = start + 1 + inner.length
      input.setSelectionRange(caret, caret)
      input.dispatchEvent(new Event('input', { bubbles: true }))
    }
  })

  root.addEventListener('keydown', (e) => {
    const input = e.target
    if (!input.dataset?.blank || e.key !== 'Backspace') return
    const { selectionStart: start, selectionEnd: end, value } = input
    if (start === end && start > 0 && PAIRS[value[start - 1]] === value[start]) {
      e.preventDefault()
      input.setRangeText('', start - 1, start + 1, 'end')
      input.dispatchEvent(new Event('input', { bubbles: true }))
    }
  })

  root.addEventListener('input', (e) => {
    const line = blanks[e.target.dataset.blank - 1]
    if (!line) return
    line.value = e.target.value
    render()
  })

  root.addEventListener('keydown', (e) => {
    const i = Number(e.target.dataset?.blank) - 1
    const line = blanks[i]
    if (!line) return

    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      fill(line, line.solution)
      render()
      focusBlank(i + 1)
    } else if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault()
      focusBlank(i + 1)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      focusBlank(i - 1)
    } else if (e.key === 'Escape') {
      e.target.blur()
    }
  })

  // ─── Strings editables ───
  // Cambian el input y el escenario, pero no la puntuación de los huecos
  const editKeys = [...new Set(edits.map((l) => l.edit.key).filter(Boolean))]
  const stageNodes = (key) => [...document.querySelectorAll(`[data-edit="${CSS.escape(key)}"]`)]
  const stageOriginal = new Map(editKeys.flatMap(stageNodes).map((n) => {
    const attr = n.dataset.editAttr
    return [n, attr ? n.getAttribute(attr) : n.innerHTML]
  }))

  function paintStageNode (node, value, pristine) {
    const attr = node.dataset.editAttr
    const original = stageOriginal.get(node)
    if (!attr) {
      if (pristine) node.innerHTML = original
      else node.textContent = value
      return
    }
    const url = /^(https?:|data:)/.test(value) ? value : (node.dataset.editBase ?? '') + value
    node.setAttribute(attr, pristine ? original : url)
    // el alt original describe la foto original: con otra imagen, mejor el nombre o la URL
    if (node.tagName === 'IMG') {
      if (!stageAlt.has(node)) stageAlt.set(node, node.alt)
      node.alt = pristine ? stageAlt.get(node) : value
    }
  }
  const stageAlt = new Map()

  function syncStage () {
    for (const key of editKeys) {
      const group = edits.filter((l) => l.edit.key === key)
      const pristine = group.every((l) => l.edit.value === l.edit.original)
      const value = group.map((l) => l.edit.value).join('')
      for (const node of stageNodes(key)) paintStageNode(node, value, pristine)
    }
  }

  function resetEdits () {
    for (const { edit } of edits) {
      edit.value = edit.original
      edit.el.textContent = edit.original
    }
    syncStage()
  }

  const editOf = (target) => {
    const node = target?.nodeType === Node.TEXT_NODE ? target.parentElement : target
    const el = node?.closest?.('.edit')
    return el && edits.find((l) => l.edit.el === el)
  }

  root.addEventListener('input', (e) => {
    const line = editOf(e.target)
    if (!line) return
    line.edit.value = e.target.textContent
    syncStage()
    // el resultado que había era de otro input: lo quitamos
    if (state.status !== 'idle') resetRun()
  })

  root.addEventListener('keydown', (e) => {
    if (!editOf(e.target)) return
    if (e.key === 'Enter') {
      e.preventDefault()
      run()
    } else if (e.key === 'Escape') {
      e.target.blur()
    }
  })

  // Pegar: solo texto y en una línea
  root.addEventListener('paste', (e) => {
    if (!editOf(e.target)) return
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain').replace(/\s*\r?\n\s*/g, ' ')
    document.execCommand('insertText', false, text)
  })

  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
      e.preventDefault()
      run()
    }
  })

  panel.querySelector('.code-head').addEventListener('click', (e) => {
    const fileTab = e.target.closest('[data-file-tab]')
    if (fileTab) return showFile(Number(fileTab.dataset.fileTab))
    const action = e.target.closest('[data-action]')?.dataset.action
    if (action === 'run') return run()
    // pistas, reiniciar y solución son del ejercicio: vuelve a su pestaña
    if (['hints', 'reset', 'solve'].includes(action)) showFile(0)
    if (action === 'hints') {
      const on = hintsBtn.getAttribute('aria-pressed') !== 'true'
      hintsBtn.setAttribute('aria-pressed', String(on))
      hintsBtn.dataset.tip = `${on ? 'Ocultar' : 'Mostrar'} pistas`
    } else if (action === 'console') {
      return toggleConsole(!consoleHidden)
    } else if (action === 'focus') {
      return toggleFocus(!focusCode)
    } else if (action === 'reset') {
      blanks.forEach((l) => fill(l, ''))
      resetEdits()
      editor.scrollTop = 0
      resetRun()
    } else if (action === 'solve') {
      blanks.forEach((l) => fill(l, l.solution))
    }
    if (action) render()
  })

  // ─── Ejecución ───
  // state = { status, calls: [{ request, response, error, status, ms }], logs, error }
  let state = { status: 'idle', calls: [], logs: [], error: null }
  let runId = 0
  let tab = 'console'
  let selectedCall = -1
  let autoTimer

  function scheduleAutoRun () {
    clearTimeout(autoTimer)
    autoTimer = setTimeout(() => { if (done) run() }, 350)
  }

  function update (patch) {
    state = { ...state, ...patch }
    stage?.setAttribute('data-status', state.status)
    renderOutput()
    renderFoot()
    try {
      window.renderStage?.(state)
    } catch (err) {
      console.error('renderStage', err)
    }
  }

  function resetRun () {
    runId++
    selectedCall = -1
    update({ status: 'idle', calls: [], logs: [], error: null })
  }

  // Error con la misma forma que los del SDK: "400 Invalid value: ..."
  class APIError extends Error {
    constructor (status, body) {
      const msg = body?.error?.message ?? (typeof body === 'string' ? body : 'Error desconocido')
      super(`${status} ${msg}`)
      this.name = 'APIError'
      this.status = status
      this.error = body?.error
    }
  }

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

  function makeOpenAI (id) {
    let index = 0
    const create = async (body) => {
      const call = { request: structuredClone(body), status: 'pending', i: index++ }
      if (id !== runId) throw new Error('Ejecución cancelada')
      update({ calls: [...state.calls, call] })
      const t0 = performance.now()
      try {
        let json
        if (MOCK) {
          await sleep(450 + Math.random() * 350)
          json = structuredClone(mocks[call.i % Math.max(mocks.length, 1)] ?? { answers: [] })
        } else {
          const res = await fetch(ENDPOINT, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(body)
          })
          const text = await res.text()
          let parsed
          try { parsed = JSON.parse(text) } catch { parsed = text }
          if (!res.ok) throw new APIError(res.status, parsed)
          json = parsed
        }
        Object.assign(call, { response: json, status: 'done', code: 200, ms: Math.round(performance.now() - t0) })
        if (id === runId) update({ calls: [...state.calls] })
        return json
      } catch (err) {
        Object.assign(call, { error: err.message, status: 'error', code: err.status, ms: Math.round(performance.now() - t0) })
        if (id === runId) update({ calls: [...state.calls] })
        throw err
      }
    }

    return class OpenAI {
      constructor () {
        this.decisions = { create }
      }
    }
  }

  // readFile de node:fs/promises → lee de assets/files/
  async function readFile (path, encoding) {
    const name = String(path).replace(/^\.?\//, '')
    const res = await fetch(`assets/files/${name}`)
    if (!res.ok) throw new Error(`ENOENT: no such file or directory, open '${name}'`)
    if (encoding === 'utf8' || encoding === 'utf-8' || encoding?.encoding?.startsWith?.('utf')) return res.text()
    const bytes = new Uint8Array(await res.arrayBuffer())
    return {
      length: bytes.length,
      toString (enc) {
        if (enc !== 'base64') return new TextDecoder().decode(bytes)
        let bin = ''
        for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
        return btoa(bin)
      }
    }
  }

  function makeConsole (id) {
    const push = (level) => (...args) => {
      if (id !== runId) return
      update({ logs: [...state.logs, { level, args }] })
    }
    return { log: push('log'), info: push('log'), warn: push('warn'), error: push('error'), table: push('log') }
  }

  // Quita los imports (los proporcionamos nosotros) sin mover los números de línea
  const IMPORT = /^\s*import\s+[\s\S]*?\s+from\s+["'](openai|node:fs\/promises|fs\/promises)["'];?[ \t]*$/gm

  async function run () {
    clearTimeout(autoTimer)
    const id = ++runId
    selectedCall = -1
    update({ status: 'running', calls: [], logs: [], error: null })

    const code = assemble().replace(IMPORT, '')
    const AsyncFunction = (async () => {}).constructor
    try {
      const fn = new AsyncFunction('OpenAI', 'readFile', 'console', 'process', `${code}\n//# sourceURL=${source.dataset.file}`)
      await fn(makeOpenAI(id), readFile, makeConsole(id), { env: {} })
      if (id === runId) update({ status: 'done' })
    } catch (err) {
      if (id !== runId) return
      const msg = err instanceof SyntaxError ? `SyntaxError: ${err.message}` : `${err.name}: ${err.message}`
      update({ status: 'error', error: msg })
    }
  }

  // ─── Salida: consola, petición y respuesta ───
  const shorten = (_key, value) => {
    if (typeof value !== 'string') return value
    if (value.startsWith('data:') && value.length > 120) {
      const kb = Math.round((value.length * 3) / 4 / 1024)
      return `${value.slice(0, value.indexOf(',') + 12)}…(${kb} KB)`
    }
    if (value.length > 280) return `${value.slice(0, 120)}… (+${(value.length - 120).toLocaleString('es')} caracteres)`
    return value
  }

  const jsonHTML = (value) => {
    const text = JSON.stringify(value, shorten, 2) ?? String(value)
    return highlight(text, 'json').map(paint).join('\n')
  }

  const fmtArg = (a) => {
    if (typeof a === 'string') return `<span class="s">${esc(a)}</span>`
    if (typeof a === 'number' || typeof a === 'boolean' || a == null) return `<span class="n">${esc(String(a))}</span>`
    return `<pre class="j">${jsonHTML(a)}</pre>`
  }

  function renderOutput () {
    tabs.forEach((t) => t.setAttribute('aria-selected', String(t.dataset.tab === tab)))

    const { calls, logs, status, error } = state
    const sel = selectedCall >= 0 && calls[selectedCall] ? selectedCall : calls.length - 1
    callsEl.innerHTML = tab !== 'console' && calls.length > 1
      ? calls.map((c, i) => `<button type="button" data-call="${i}" aria-pressed="${i === sel}" class="${c.status}">#${i + 1}</button>`).join('')
      : ''

    if (status === 'running') {
      outStatus.innerHTML = `<i class="dot run"></i>${calls.filter((c) => c.status === 'pending').length ? 'esperando respuesta…' : 'ejecutando…'}`
    } else if (status === 'error') {
      outStatus.innerHTML = '<i class="dot err"></i>error'
    } else if (status === 'done') {
      const ms = Math.max(0, ...calls.map((c) => c.ms ?? 0))
      outStatus.innerHTML = `<i class="dot ok"></i>${calls.length} petici${calls.length === 1 ? 'ón' : 'ones'} · ${ms} ms`
    } else {
      outStatus.innerHTML = ''
    }

    if (tab === 'console') {
      const rows = logs.map((l) => `<div class="log ${l.level}">${l.args.map(fmtArg).join(' ')}</div>`)
      if (error) rows.push(`<div class="log error">${esc(error)}</div>`)
      if (!rows.length) {
        rows.push(status === 'running'
          ? '<div class="log muted">…</div>'
          : `<div class="log muted">Completa los huecos o pulsa <b>▶</b> (${mod}S).${status === 'done' ? ' El código no ha escrito nada en consola.' : ''}</div>`)
      }
      outBody.innerHTML = rows.join('')
      outBody.scrollTop = outBody.scrollHeight
      return
    }

    const call = calls[sel]
    if (!call) {
      outBody.innerHTML = '<div class="log muted">Todavía no hay ninguna petición.</div>'
      return
    }
    const head = `<div class="log muted">${tab === 'request' ? `POST ${ENDPOINT}` : call.status === 'pending' ? 'esperando…' : `${call.code ?? (call.status === 'error' ? 'error' : 200)} · ${call.ms} ms`}</div>`
    const body = tab === 'request'
      ? call.request
      : call.response ?? (call.error ? { error: call.error } : null)
    outBody.innerHTML = head + (body ? `<pre class="j">${jsonHTML(body)}</pre>` : '')
    outBody.scrollTop = 0
  }

  function toggleConsole (hidden) {
    consoleHidden = hidden
    document.documentElement.classList.toggle('no-console', hidden)
    const btn = panel.querySelector('.code-head [data-action="console"]')
    btn.setAttribute('aria-pressed', String(!hidden))
    btn.dataset.tip = `${hidden ? 'Mostrar' : 'Ocultar'} consola`
    localStorage.setItem(CONSOLE_KEY, hidden ? '1' : '0')
  }

  function toggleFocus (on) {
    focusCode = on
    document.documentElement.classList.toggle('focus-code', on)
    const btn = panel.querySelector('.code-head [data-action="focus"]')
    btn.setAttribute('aria-pressed', String(on))
    btn.dataset.tip = on ? 'Mostrar todo' : 'Solo el código'
    btn.innerHTML = on ? ICONS.restore : ICONS.focus
    localStorage.setItem(FOCUS_KEY, on ? '1' : '0')
  }

  panel.querySelector('.out-head').addEventListener('click', (e) => {
    if (e.target.closest('[data-action="console"]')) return toggleConsole(true)
    const t = e.target.closest('[data-tab]')
    const c = e.target.closest('[data-call]')
    if (t) tab = t.dataset.tab
    if (c) selectedCall = Number(c.dataset.call)
    if (t || c) renderOutput()
  })

  // ─── Pie del escenario: endpoint, estado, latencia y tokens ───
  const foot = document.createElement('footer')
  foot.className = 'stage-foot'
  stage?.append(foot)

  function renderFoot () {
    const { calls, status } = state
    const tokens = calls.reduce((n, c) => n + (c.response?.usage?.input_tokens ?? 0), 0)
    const cached = calls.reduce((n, c) => n + (c.response?.usage?.input_tokens_details?.cached_tokens ?? 0), 0)
    const ms = Math.max(0, ...calls.map((c) => c.ms ?? 0))
    const label = {
      idle: 'esperando tu código',
      running: 'llamando a la API…',
      done: `${calls.length} petici${calls.length === 1 ? 'ón' : 'ones'} · ${ms} ms`,
      error: 'error'
    }[status]
    foot.innerHTML = `
      <span class="ep"><i class="dot ${{ idle: '', running: 'run', done: 'ok', error: 'err' }[status]}"></i>POST /v1/decisions</span>
      <span>${label}</span>
      ${tokens ? `<span>${tokens.toLocaleString('es')} tokens${cached ? ` · ${cached.toLocaleString('es')} en caché` : ''}</span>` : ''}
      ${MOCK ? '<span class="mock">mock</span>' : ''}
    `
  }

  // ?solucion → arranca con el ejercicio resuelto (y se ejecuta)
  if (params.has('solucion')) blanks.forEach((l) => fill(l, l.solution))

  update({})
  render()
})()
