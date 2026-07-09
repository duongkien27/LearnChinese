/**
 * Speak Chinese text using the browser's built-in SpeechSynthesis engine.
 * This stands in for the `audio` field in data.json (currently a placeholder):
 * no audio files are needed and it works fully offline in most browsers.
 */
export function speak(text) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  try {
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'zh-CN'
    u.rate = 0.85
    // Prefer an installed Chinese voice when available.
    const zh = window.speechSynthesis.getVoices().find((v) => v.lang?.startsWith('zh'))
    if (zh) u.voice = zh
    window.speechSynthesis.speak(u)
  } catch {
    /* speech unavailable — silently ignore */
  }
}
