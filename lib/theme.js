// Theme handling, same behaviour as the prototype: dark by default,
// light, or match the phone.
export function lsTheme() {
  try { return localStorage.getItem('ol_theme') } catch (e) { return null }
}

export function resolveTheme(t) {
  if (t === 'system') {
    return window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  }
  return t === 'light' ? 'light' : 'dark'
}

export function applyTheme(t) {
  const m = resolveTheme(t)
  document.documentElement.setAttribute('data-theme', m)
  return m
}

export function saveThemeLocal(t) {
  try { localStorage.setItem('ol_theme', t) } catch (e) {}
}
