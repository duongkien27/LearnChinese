import { useState, useEffect, useMemo, useRef } from 'react'
import { speak } from '../utils/speak'
import { getIllustration } from '../utils/illustration'

/**
 * Quiz / "Test Yourself" mode with two sub-types:
 *
 *  • "meaning"  – shows the Chinese; learner recalls the meaning, reveals
 *                 pinyin + Vietnamese, then self-grades (nhớ / chưa nhớ).
 *  • "writing"  – shows pinyin + Vietnamese (+ picture); learner types the
 *                 Chinese and it is compared to the answer (Đúng / Sai).
 *
 * A right answer in either mode marks the item as learned. Score and
 * progress are shared across both sub-types.
 */
export default function QuizPanel({ items, isLearned, onToggle }) {
  const [quizType, setQuizType] = useState('meaning') // 'meaning' | 'writing'
  const deck = useMemo(() => shuffle(items), [items])

  const [index, setIndex] = useState(0)
  const [score, setScore] = useState({ right: 0, wrong: 0 })
  const [revealed, setRevealed] = useState(false) // meaning mode
  const [value, setValue] = useState('') // writing mode
  const [status, setStatus] = useState('idle') // writing: 'idle' | 'correct' | 'wrong'
  const inputRef = useRef(null)

  const reset = () => {
    setIndex(0)
    setScore({ right: 0, wrong: 0 })
    setRevealed(false)
    setValue('')
    setStatus('idle')
  }

  // Restart when the deck (tab/filter) or the quiz type changes.
  useEffect(reset, [deck, quizType])

  // Focus the input on each new question in writing mode.
  useEffect(() => {
    if (quizType === 'writing' && status === 'idle') inputRef.current?.focus()
  }, [index, status, quizType])

  if (deck.length === 0) {
    return (
      <div className="py-20 text-center text-slate-400">
        <p className="text-4xl mb-3">📝</p>
        <p>Chưa có nội dung để kiểm tra.</p>
      </div>
    )
  }

  const done = index >= deck.length
  const card = done ? null : deck[index]
  const emoji = card ? getIllustration(card) : null

  const advance = (isRight) => {
    if (isRight && card && !isLearned(card.id)) onToggle(card.id)
    setScore((s) => ({ right: s.right + (isRight ? 1 : 0), wrong: s.wrong + (isRight ? 0 : 1) }))
    setRevealed(false)
    setValue('')
    setStatus('idle')
    setIndex((i) => i + 1)
  }

  const checkWriting = () => {
    if (!value.trim()) return
    setStatus(normalize(value) === normalize(card.chinese) ? 'correct' : 'wrong')
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center">
      {/* Quiz-type toggle */}
      <div className="mb-4 flex w-full gap-1.5 rounded-full bg-slate-100 p-1">
        {[
          { key: 'meaning', label: '🧠 Nhớ nghĩa' },
          { key: 'writing', label: '✍️ Viết chữ Hán' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setQuizType(t.key)}
            className={`flex-1 rounded-full py-2 text-sm font-medium transition ${
              quizType === t.key ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* progress */}
      <div className="mb-4 flex w-full items-center justify-between text-sm text-slate-400">
        <span>
          Câu {Math.min(index + 1, deck.length)} / {deck.length}
        </span>
        <span>
          <span className="text-emerald-600">✓ {score.right}</span>{' '}
          <span className="ml-2 text-brand-600">✗ {score.wrong}</span>
        </span>
      </div>

      {done ? (
        <Completion score={score} total={deck.length} onRestart={reset} />
      ) : quizType === 'meaning' ? (
        <MeaningQuiz
          card={card}
          emoji={emoji}
          revealed={revealed}
          onFlip={() => setRevealed((v) => !v)}
          onGrade={advance}
        />
      ) : (
        <WritingQuiz
          card={card}
          emoji={emoji}
          value={value}
          setValue={setValue}
          status={status}
          onCheck={checkWriting}
          onNext={() => advance(status === 'correct')}
          isLast={index + 1 >= deck.length}
          inputRef={inputRef}
        />
      )}
    </div>
  )
}

/* ── Sub-type: recall the meaning, flip a 2-sided card, self-grade ── */
function MeaningQuiz({ card, emoji, revealed, onFlip, onGrade }) {
  const onKeyDown = (e) => {
    if (e.key === 'Enter') onFlip()
  }
  return (
    <div className="flex w-full flex-col items-center" tabIndex={0} onKeyDown={onKeyDown}>
      <p className="mb-3 text-xs uppercase tracking-wide text-slate-400">
        Từ / câu này nghĩa là gì?
      </p>

      {/* Flip card: front = Chinese, back = meaning */}
      <div className="flip-card h-64 w-full cursor-pointer sm:h-72" onClick={onFlip}>
        <div className={`flip-inner ${revealed ? 'is-flipped' : ''}`}>
          {/* Front */}
          <div className="flip-face rounded-3xl border border-slate-100 bg-white shadow-card">
            <span className="font-cn text-5xl font-medium text-slate-900 sm:text-6xl">
              {card.chinese}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                speak(card.chinese)
              }}
              className="mt-4 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-brand-100 hover:text-brand-600"
              title="Nghe phát âm"
            >
              🔊
            </button>
            <span className="mt-4 text-sm text-slate-400">Nhấn để lật xem nghĩa</span>
          </div>
          {/* Back */}
          <div className="flip-face flip-back rounded-3xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white shadow-card">
            {emoji && <span className="mb-1 text-4xl leading-none">{emoji}</span>}
            <span className="text-xl font-semibold text-brand-600">{card.pinyin}</span>
            {card.type && (
              <span className="mt-1 rounded-full bg-white/70 px-2 py-0.5 text-xs text-slate-500">
                {card.type}
              </span>
            )}
            {card.hanviet && (
              <span className="mt-1 text-sm font-semibold text-slate-700">{card.hanviet}</span>
            )}
            <span className="mt-1 px-6 text-center text-lg text-slate-600">{card.vietnamese}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 w-full">
        {!revealed ? (
          <p className="text-center text-sm text-slate-400">
            Nhớ nghĩa trong đầu, rồi lật thẻ để đối chiếu
          </p>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={() => onGrade(false)}
              className="flex-1 rounded-full border border-slate-200 bg-white py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              ↻ Chưa nhớ
            </button>
            <button
              onClick={() => onGrade(true)}
              className="flex-1 rounded-full bg-emerald-500 py-3 text-sm font-medium text-white transition hover:bg-emerald-600"
            >
              ✓ Tôi đã nhớ
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Sub-type: type the Chinese, auto-check ── */
function WritingQuiz({ card, emoji, value, setValue, status, onCheck, onNext, isLast, inputRef }) {
  const onKeyDown = (e) => {
    if (e.key !== 'Enter') return
    status === 'idle' ? onCheck() : onNext()
  }
  return (
    <div className="w-full">
      <div className="w-full rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-card">
        <p className="text-xs uppercase tracking-wide text-slate-400">Viết chữ Hán cho nghĩa sau</p>
        {emoji && <p className="mt-3 text-6xl leading-none">{emoji}</p>}
        <p className="mt-4 text-2xl font-semibold text-brand-600">{card.pinyin}</p>
        {card.type && <p className="mt-1 text-xs text-slate-400">{card.type}</p>}
        {card.hanviet && <p className="text-sm font-semibold text-slate-700">{card.hanviet}</p>}
        <p className="mt-1 text-lg text-slate-600">{card.vietnamese}</p>

        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={status !== 'idle'}
          placeholder="Gõ chữ Hán ở đây…"
          lang="zh"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className={`mt-6 w-full rounded-xl border-2 bg-white py-3 text-center font-cn text-3xl outline-none transition
            ${
              status === 'correct'
                ? 'border-emerald-400 text-emerald-600'
                : status === 'wrong'
                ? 'border-brand-400 text-brand-600'
                : 'border-slate-200 text-slate-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-100'
            }`}
        />

        {status !== 'idle' && (
          <div className="mt-4">
            {status === 'correct' ? (
              <p className="text-lg font-semibold text-emerald-600">✓ Chính xác!</p>
            ) : (
              <div>
                <p className="text-lg font-semibold text-brand-600">✗ Chưa đúng</p>
                <p className="mt-1 text-sm text-slate-500">
                  Đáp án:{' '}
                  <span className="font-cn text-2xl font-medium text-slate-800">{card.chinese}</span>
                </p>
              </div>
            )}
            <button
              onClick={() => speak(card.chinese)}
              className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-500 transition hover:bg-brand-100 hover:text-brand-600"
            >
              🔊 Nghe phát âm
            </button>
          </div>
        )}
      </div>

      <div className="mt-6 w-full">
        {status === 'idle' ? (
          <button
            onClick={onCheck}
            disabled={!value.trim()}
            className="w-full rounded-full bg-brand-600 py-3 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Kiểm tra
          </button>
        ) : (
          <button
            onClick={onNext}
            className="w-full rounded-full bg-emerald-500 py-3 text-sm font-medium text-white transition hover:bg-emerald-600"
          >
            {isLast ? 'Xem kết quả' : 'Câu tiếp theo'}
          </button>
        )}
      </div>

      <p className="mt-3 text-center text-xs text-slate-400">
        Cần bật bộ gõ tiếng Trung (pinyin IME) để nhập chữ Hán · Nhấn Enter để kiểm tra
      </p>
    </div>
  )
}

/* ── Shared completion screen ── */
function Completion({ score, total, onRestart }) {
  const answered = score.right + score.wrong
  const pct = answered ? Math.round((score.right / answered) * 100) : 0
  return (
    <div className="mx-auto max-w-md py-12 text-center">
      <p className="text-5xl">{pct >= 80 ? '🎉' : '💪'}</p>
      <h3 className="mt-4 text-xl font-semibold text-slate-800">Hoàn thành!</h3>
      <p className="mt-2 text-slate-500">
        Đúng <b className="text-emerald-600">{score.right}</b> / {total} · Sai{' '}
        <b className="text-brand-600">{score.wrong}</b> · Chính xác <b>{pct}%</b>
      </p>
      <button
        onClick={onRestart}
        className="mt-6 rounded-full bg-brand-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-brand-700"
      >
        Làm lại
      </button>
    </div>
  )
}

/** Strip whitespace and common punctuation so only the characters matter. */
function normalize(s) {
  return s
    .replace(/\s/g, '')
    .replace(/[，。！？、；：“”‘’（）,.!?;:()'"]/g, '')
    .toLowerCase()
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
