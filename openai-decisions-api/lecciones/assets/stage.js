/* ──────────────────────────────────────────────────────────────
   Helpers para pintar respuestas en el escenario (izquierda).
   Cada lección define window.renderStage(state) y usa window.ui
   ────────────────────────────────────────────────────────────── */
(() => {
  'use strict'

  const $ = (sel, root = document) => root.querySelector(sel)
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)]
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
  const fix = (n, d = 2) => (n == null || Number.isNaN(n) ? '—' : Number(n).toFixed(d))
  const el = (target) => (typeof target === 'string' ? $(target) : target)

  // Las respuestas de una llamada, indexadas por name (o por posición)
  function answers (call) {
    const list = call?.response?.answers ?? []
    const byName = {}
    list.forEach((a, i) => { byName[a.name ?? i] = a; byName[i] = a })
    return byName
  }

  // Valor numérico + barra: <div class="meter" data-meter> <b class="val"></b> <div class="bar"><i></i></div>
  // max: para un score con n niveles, n - 1 (la barra va de 0 a max)
  function meter (target, p, max = 1) {
    const node = el(target)
    if (!node) return
    const has = typeof p === 'number'
    node.style.setProperty('--p', has ? Math.min(1, Math.max(0, p / max)) : 0)
    node.classList.toggle('has-value', has)
    const val = $('.val', node)
    if (val) val.textContent = has ? fix(p) : '—'
  }

  // Distribución de probabilidades (choice y score)
  function dist (target, options, answer, { picked } = {}) {
    const node = el(target)
    if (!node) return
    const probs = new Map((answer?.probabilities ?? []).map((p) => [String(p.label ?? p.value), p.probability]))
    const byValue = new Map((answer?.probabilities ?? []).map((p) => [String(p.value), p.probability]))
    const chosen = picked ?? (answer?.type === 'choice' ? String(answer.choice) : null)
    node.innerHTML = options.map((o) => {
      const key = String(o.value)
      const p = probs.get(o.label ?? key) ?? byValue.get(key)
      const has = typeof p === 'number'
      return `
        <div class="row${chosen === key ? ' is-picked' : ''}" style="--p:${has ? p : 0}">
          <span class="k">${esc(o.label ?? key)}</span>
          <span class="bar"><i></i></span>
          <span class="v">${has ? fix(p) : '—'}</span>
        </div>`
    }).join('')
  }

  function text (target, value) {
    const node = el(target)
    if (node) node.textContent = value ?? '—'
  }

  function toggle (target, cls, on) {
    const node = el(target)
    if (node) node.classList.toggle(cls, Boolean(on))
  }

  window.ui = { $, $$, esc, fix, answers, meter, dist, text, toggle }
})()
