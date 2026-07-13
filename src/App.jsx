import { useState, useEffect, useMemo } from 'react'
import DataList from './components/DataList'
import Flashcard from './components/Flashcard'
import QuizPanel from './components/QuizPanel'
import { useLearned } from './hooks/useLearned'

const MODES = [
  { key: 'list', label: 'Danh sách', icon: '📖' },
  { key: 'flashcard', label: 'Thẻ ghi nhớ', icon: '🃏' },
  { key: 'quiz', label: 'Kiểm tra', icon: '🎯' },
]

export default function App() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState(null)
  const [mode, setMode] = useState('list')
  const [query, setQuery] = useState('')

  const { toggle, isLearned, resetCategory } = useLearned()

  // Load all content from the local data.json file (no backend).
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((d) => {
        setData(d)
        setTab(d.groups[0]?.key ?? 'sentences')
      })
      .catch((e) => setError(e.message))
  }, [])

  // Tabs are built from the data: one per vocab group, plus the sentences set.
  const tabs = useMemo(() => {
    if (!data) return []
    return [
      ...data.groups.map((g) => ({ key: g.key, label: g.label, items: g.items })),
      { key: 'sentences', label: 'Giao tiếp', items: data.sentences },
    ]
  }, [data])

  const allItems = useMemo(() => {
    if (!data || !tab) return []
    if (tab === 'sentences') return data.sentences
    return data.groups.find((g) => g.key === tab)?.items ?? []
  }, [data, tab])

  // Filter by search across Chinese, pinyin and Vietnamese.
  const items = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return allItems
    return allItems.filter(
      (it) =>
        it.chinese.toLowerCase().includes(q) ||
        it.pinyin.toLowerCase().includes(q) ||
        it.vietnamese.toLowerCase().includes(q)
    )
  }, [allItems, query])

  const learnedCount = allItems.filter((it) => isLearned(it.id)).length
  const pct = allItems.length ? Math.round((learnedCount / allItems.length) * 100) : 0

  return (
    <div className="mx-auto flex min-h-full max-w-3xl flex-col px-4 pb-16">
      {/* Header */}
      <header className="pt-8 pb-4 text-center">
        <h1 className="font-cn text-3xl font-bold text-slate-900">
          学中文 <span className="font-sans text-lg font-medium text-brand-600">· Học Tiếng Trung</span>
        </h1>
        <p className="mt-1 text-sm text-slate-400">300 từ vựng cơ bản &amp; 100 câu giao tiếp</p>
      </header>

      {/* Tabs (scrollable) */}
      <nav className="scroll-thin -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {tabs.map((t) => {
          const done = t.items.filter((it) => isLearned(it.id)).length
          const tabPct = t.items.length ? Math.round((done / t.items.length) * 100) : 0
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`shrink-0 rounded-2xl border px-4 py-2 text-center transition ${
                tab === t.key
                  ? 'border-brand-500 bg-brand-50'
                  : 'border-slate-200 bg-white hover:border-brand-200'
              }`}
            >
              <span
                className={`block text-sm font-semibold ${
                  tab === t.key ? 'text-brand-600' : 'text-slate-600'
                }`}
              >
                {t.label}
              </span>
              <div className="mt-1.5 flex items-center gap-1.5">
                <div className="h-1.5 w-14 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${tabPct}%` }}
                  />
                </div>
                <span className="text-[10px] tabular-nums text-slate-400">
                  {done}/{t.items.length}
                </span>
              </div>
            </button>
          )
        })}
      </nav>

      {/* Progress */}
      <div className="mb-4 rounded-2xl border border-slate-100 bg-white p-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-slate-600">
            Tiến độ: {learnedCount}/{allItems.length} đã thuộc
          </span>
          <div className="flex items-center gap-3">
            <span className="font-semibold text-emerald-600">{pct}%</span>
            {learnedCount > 0 && (
              <button
                onClick={() => resetCategory(allItems.map((it) => it.id))}
                className="text-xs text-slate-400 underline-offset-2 hover:text-brand-600 hover:underline"
              >
                Đặt lại
              </button>
            )}
          </div>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Controls: search + mode */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            🔍
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm chữ Hán, pinyin hoặc nghĩa tiếng Việt…"
            className="w-full rounded-full border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <div className="flex gap-1.5 rounded-full bg-slate-100 p-1">
          {MODES.map((m) => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition ${
                mode === m.key ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500'
              }`}
              title={m.label}
            >
              <span>{m.icon}</span>
              <span className="hidden font-medium sm:inline">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1">
        {error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center text-red-600">
            Không tải được dữ liệu: {error}
          </div>
        )}

        {!error && !data && (
          <div className="py-20 text-center text-slate-400">Đang tải dữ liệu…</div>
        )}

        {!error && data && (
          <>
            {mode === 'list' && (
              <DataList items={items} isLearned={isLearned} onToggle={toggle} />
            )}
            {mode === 'flashcard' && (
              <Flashcard items={items} isLearned={isLearned} onToggle={toggle} />
            )}
            {mode === 'quiz' && (
              <QuizPanel items={items} isLearned={isLearned} onToggle={toggle} />
            )}
          </>
        )}
      </main>

      <footer className="mt-10 text-center text-xs text-slate-300">
        Tiến độ được lưu tự động trên trình duyệt của bạn · Made for learners
      </footer>
    </div>
  )
}
