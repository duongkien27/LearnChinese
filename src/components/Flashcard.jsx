import { useState, useEffect } from 'react'
import { speak } from '../utils/speak'
import { getIllustration } from '../utils/illustration'

/**
 * Flashcard mode: shows one card at a time. The front displays the Chinese
 * characters; clicking flips the card (3D) to reveal pinyin + Vietnamese.
 * Navigation buttons move through the deck and a card can be marked learned.
 */
export default function Flashcard({ items, isLearned, onToggle }) {
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)

  // Keep the index valid when the deck (filter/tab) changes.
  useEffect(() => {
    setIndex(0)
    setFlipped(false)
  }, [items])

  if (items.length === 0) {
    return (
      <div className="py-20 text-center text-slate-400">
        <p className="text-4xl mb-3">🗂️</p>
        <p>Không có thẻ nào để học. Thử đổi bộ lọc.</p>
      </div>
    )
  }

  const card = items[Math.min(index, items.length - 1)]
  const learned = isLearned(card.id)
  const emoji = getIllustration(card)

  const go = (delta) => {
    setFlipped(false)
    setIndex((i) => (i + delta + items.length) % items.length)
  }

  return (
    <div className="flex flex-col items-center">
      <p className="mb-4 text-sm font-medium text-slate-400">
        Thẻ {index + 1} / {items.length}
      </p>

      {/* Card */}
      <div
        className="flip-card h-72 w-full max-w-md cursor-pointer sm:h-80"
        onClick={() => setFlipped((f) => !f)}
      >
        <div className={`flip-inner ${flipped ? 'is-flipped' : ''}`}>
          {/* Front */}
          <div className="flip-face rounded-3xl border border-slate-100 bg-white shadow-card">
            {emoji && <span className="mb-3 text-6xl leading-none sm:text-7xl">{emoji}</span>}
            <span
              className={`font-cn font-medium text-slate-900 ${
                emoji ? 'text-6xl sm:text-7xl' : 'text-7xl sm:text-8xl'
              }`}
            >
              {card.chinese}
            </span>
            <span className="mt-6 text-sm text-slate-400">Nhấn để lật thẻ</span>
          </div>
          {/* Back */}
          <div className="flip-face flip-back rounded-3xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white shadow-card">
            {emoji && <span className="mb-2 text-5xl leading-none">{emoji}</span>}
            <span className="font-cn text-4xl font-medium text-slate-800">{card.chinese}</span>
            <span className="mt-3 text-2xl font-semibold text-brand-600">{card.pinyin}</span>
            {card.type && (
              <span className="mt-1 rounded-full bg-white/70 px-2 py-0.5 text-xs text-slate-500">
                {card.type}
              </span>
            )}
            <span className="mt-2 px-6 text-center text-lg text-slate-600">{card.vietnamese}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={() => go(-1)}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
          title="Thẻ trước"
        >
          ‹
        </button>

        <button
          onClick={() => speak(card.chinese)}
          className="flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-slate-600 transition hover:bg-slate-50"
        >
          🔊 <span className="text-sm">Nghe</span>
        </button>

        <button
          onClick={() => onToggle(card.id)}
          className={`flex h-11 items-center gap-2 rounded-full px-5 text-sm font-medium transition
            ${
              learned
                ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
        >
          {learned ? '✓ Đã thuộc' : 'Đánh dấu đã thuộc'}
        </button>

        <button
          onClick={() => go(1)}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
          title="Thẻ tiếp theo"
        >
          ›
        </button>
      </div>
    </div>
  )
}
