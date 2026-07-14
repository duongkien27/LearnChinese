import { useState, useEffect, useRef } from 'react'
import { speak } from '../utils/speak'
import { getIllustration } from '../utils/illustration'

// Render an example sentence with every occurrence of the target word in red.
function highlightExample(example, word) {
  if (!example) return null
  // The dictionary form may include optional parts like 有（一）点儿; fall back
  // to the form without parentheses so it still matches inside the sentence.
  const key = example.includes(word) ? word : word.replace(/（[^）]*）/g, '')
  if (!key || !example.includes(key)) return example
  return example.split(key).map((part, i, arr) => (
    <span key={i}>
      {part}
      {i < arr.length - 1 && <span className="font-semibold text-red-600">{key}</span>}
    </span>
  ))
}

/**
 * Flashcard mode: shows one card at a time. The front displays the Chinese
 * characters; clicking flips the card (3D) to reveal pinyin + Vietnamese.
 *
 * Navigation: the first pass goes through every card in order. After the last
 * card, "next" loops back over only the cards not yet marked learned, until
 * all are learned — then a congratulations card is shown.
 */
export default function Flashcard({ items, isLearned, onToggle }) {
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [dir, setDir] = useState('next') // slide direction for the transition
  const [firstPassDone, setFirstPassDone] = useState(false) // finished the initial sweep?
  const [sessionDone, setSessionDone] = useState(false) // everything learned → congrats
  const touchStart = useRef({ x: 0, y: 0 })
  const didSwipe = useRef(false)

  // Reset when the deck (filter/tab) changes.
  useEffect(() => {
    setIndex(0)
    setFlipped(false)
    setFirstPassDone(false)
    setSessionDone(false)
  }, [items])

  // Auto-play the pronunciation 1s after settling on a new card. The timer is
  // cleared when the card changes, so rapid swiping won't queue up audio.
  useEffect(() => {
    if (items.length === 0 || sessionDone) return
    const current = items[Math.min(index, items.length - 1)]
    const timer = setTimeout(() => speak(current.chinese), 1000)
    return () => clearTimeout(timer)
  }, [items, index, sessionDone])

  // If progress is cleared externally (e.g. the "Đặt lại" button), leave the
  // review-loop / congratulations state and start the deck over — otherwise
  // those screens stay stuck even though nothing is marked learned anymore.
  // We watch for a drop from >0 to 0 (a real reset) so that legitimately
  // entering the loop with nothing learned yet isn't mistaken for a reset.
  const learnedInDeck = items.reduce((n, it) => n + (isLearned(it.id) ? 1 : 0), 0)
  const prevLearned = useRef(learnedInDeck)
  useEffect(() => {
    const wasReset = learnedInDeck === 0 && prevLearned.current > 0
    prevLearned.current = learnedInDeck
    if (wasReset && (firstPassDone || sessionDone)) {
      setFirstPassDone(false)
      setSessionDone(false)
      setFlipped(false)
      setDir('next')
      setIndex(0)
    }
  }, [learnedInDeck, firstPassDone, sessionDone])

  if (items.length === 0) {
    return (
      <div className="py-20 text-center text-slate-400">
        <p className="text-4xl mb-3">🗂️</p>
        <p>Không có thẻ nào để học. Thử đổi bộ lọc.</p>
      </div>
    )
  }

  // Find the next/previous card that isn't learned yet (cyclic). `skipIndex`
  // lets us treat a just-marked card as learned before React re-renders.
  const isDone = (i, skipIndex) => i === skipIndex || isLearned(items[i].id)
  const nextUnlearned = (from, skipIndex = -1) => {
    for (let step = 1; step <= items.length; step++) {
      const j = (from + step) % items.length
      if (!isDone(j, skipIndex)) return j
    }
    return -1
  }
  const prevUnlearned = (from) => {
    for (let step = 1; step <= items.length; step++) {
      const j = (from - step + items.length) % items.length
      if (!isLearned(items[j].id)) return j
    }
    return -1
  }

  const next = (justLearnedIndex = -1) => {
    setDir('next')
    setFlipped(false)
    if (!firstPassDone && index < items.length - 1) {
      setIndex(index + 1)
      return
    }
    // End of the first pass, or already looping the unlearned cards.
    const j = nextUnlearned(index, justLearnedIndex)
    if (j === -1) {
      setSessionDone(true)
    } else {
      setFirstPassDone(true)
      setIndex(j)
    }
  }

  const prev = () => {
    setDir('prev')
    setFlipped(false)
    if (!firstPassDone) {
      setIndex((i) => (i - 1 + items.length) % items.length)
    } else {
      const j = prevUnlearned(index)
      if (j !== -1) setIndex(j)
    }
  }

  const restart = () => {
    setSessionDone(false)
    setFirstPassDone(false)
    setFlipped(false)
    setDir('next')
    setIndex(0)
  }

  // Tap flips the card; a horizontal drag swipes to the next/previous card.
  const onTouchStart = (e) => {
    const t = e.changedTouches[0]
    touchStart.current = { x: t.clientX, y: t.clientY }
    didSwipe.current = false
  }
  const onTouchEnd = (e) => {
    const t = e.changedTouches[0]
    const dx = t.clientX - touchStart.current.x
    const dy = t.clientY - touchStart.current.y
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      didSwipe.current = true
      dx < 0 ? next() : prev()
    }
  }
  const onCardClick = () => {
    if (didSwipe.current) {
      didSwipe.current = false
      return
    }
    setFlipped((f) => !f)
  }

  // Congratulations screen — everything in this set is learned.
  if (sessionDone) {
    return (
      <div className="flex flex-col items-center overflow-x-clip">
        <p className="mb-4 text-sm font-medium text-slate-400">Hoàn thành</p>
        <div className="w-full max-w-md card-enter-next">
          <div className="flex h-72 flex-col items-center justify-center rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white px-6 text-center shadow-card sm:h-80">
            <span className="text-7xl">🎉</span>
            <p className="mt-4 text-2xl font-bold text-emerald-700">Chúc mừng!</p>
            <p className="mt-2 text-slate-600">
              Bạn đã thuộc hết <b>{items.length}</b> từ trong phần này.
            </p>
          </div>
        </div>
        <button
          onClick={restart}
          className="mt-6 rounded-full bg-brand-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-brand-700"
        >
          Ôn lại từ đầu
        </button>
      </div>
    )
  }

  const card = items[Math.min(index, items.length - 1)]
  const learned = isLearned(card.id)
  const isRadical = card.category === 'radicals'
  const emoji = isRadical ? null : getIllustration(card)
  const remaining = items.filter((it) => !isLearned(it.id)).length

  // Marking a card as learned auto-advances; un-marking stays put to undo.
  const handleLearn = () => {
    const wasLearned = learned
    onToggle(card.id)
    if (!wasLearned) next(index)
  }

  return (
    <div className="flex flex-col items-center overflow-x-clip">
      <p className="mb-4 text-sm font-medium text-slate-400">
        {firstPassDone
          ? `Ôn lại · còn ${remaining} từ chưa thuộc`
          : `Thẻ ${index + 1} / ${items.length}`}
      </p>

      {/* Card — key on index replays the slide-in animation on each change */}
      <div
        key={index}
        className={`w-full max-w-md ${dir === 'prev' ? 'card-enter-prev' : 'card-enter-next'}`}
      >
        <div
          className={`flip-card w-full cursor-pointer select-none ${
            isRadical ? 'h-96' : 'h-72 sm:h-80'
          }`}
          onClick={onCardClick}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div className={`flip-inner ${flipped ? 'is-flipped' : ''}`}>
            {/* Front */}
            <div className="flip-face rounded-3xl border border-slate-100 bg-white px-6 shadow-card">
              {isRadical ? (
                <>
                  {card.image && (
                    <img
                      src={card.image}
                      alt=""
                      className="h-48 w-48 rounded-xl bg-white object-contain"
                    />
                  )}
                  <span className="mt-2 font-cn text-4xl font-medium text-slate-900">
                    {card.chinese}
                    {card.variant && (
                      <span className="ml-1 text-2xl text-slate-400">({card.variant})</span>
                    )}
                  </span>
                </>
              ) : (
                <>
                  {emoji && <span className="mb-1 text-4xl leading-none sm:text-5xl">{emoji}</span>}
                  <span className="font-cn text-6xl font-medium leading-tight text-slate-900 sm:text-7xl">
                    {card.chinese}
                  </span>
                  {card.example && (
                    <p className="mt-4 font-cn text-lg leading-snug text-slate-600 sm:text-xl">
                      {highlightExample(card.example, card.chinese)}
                    </p>
                  )}
                </>
              )}
              <span className="mt-3 text-xs text-slate-400">Nhấn để lật thẻ</span>
            </div>
            {/* Back */}
            <div className="flip-face flip-back rounded-3xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white px-6 shadow-card">
              {isRadical ? (
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="font-cn text-3xl font-medium text-slate-800">
                      {card.chinese}
                    </span>
                    <span className="text-xl font-semibold text-brand-600">{card.pinyin}</span>
                  </div>
                  <span className="mt-1 text-base text-slate-600">
                    <b className="text-slate-700">{card.hanviet}</b> · {card.vietnamese}
                  </span>
                  {card.examples && (
                    <div className="mt-4 w-full border-t border-brand-100 pt-3 text-center">
                      <p className="text-[11px] uppercase tracking-wide text-slate-400">Ví dụ</p>
                      <p className="mt-0.5 font-cn text-sm leading-relaxed text-slate-600">
                        {card.examples.join('　')}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <span className="font-cn text-4xl font-medium text-slate-800">{card.chinese}</span>
                  <span className="mt-2 text-2xl font-semibold text-brand-600">{card.pinyin}</span>
                  <span className="mt-1 text-lg text-slate-600">
                    {card.vietnamese}
                    {card.type && <span className="text-slate-400"> · {card.type}</span>}
                  </span>
                  {card.example && (
                    <div className="mt-3 w-full border-t border-brand-100 pt-3 text-center">
                      <p className="font-cn text-base text-slate-700">
                        {highlightExample(card.example, card.chinese)}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">{card.examplePinyin}</p>
                      <p className="text-xs text-slate-400">{card.exampleVi}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={prev}
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
          onClick={handleLearn}
          className={`flex h-11 items-center gap-2 rounded-full px-5 text-sm font-medium transition
            ${
              learned
                ? 'border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                : 'bg-emerald-500 text-white hover:bg-emerald-600'
            }`}
        >
          {learned ? '✓ Đã thuộc' : 'Đánh dấu đã thuộc'}
        </button>

        <button
          onClick={() => next()}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
          title="Thẻ tiếp theo"
        >
          ›
        </button>
      </div>
    </div>
  )
}
