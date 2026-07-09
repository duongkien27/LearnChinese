import { speak } from '../utils/speak'

/**
 * Browsable list of vocabulary / sentence entries. Each row shows the
 * Chinese, pinyin and Vietnamese meaning, plus a "mark as learned"
 * checkbox and an audio button.
 */
export default function DataList({ items, isLearned, onToggle }) {
  if (items.length === 0) {
    return (
      <div className="py-20 text-center text-slate-400">
        <p className="text-4xl mb-3">🔍</p>
        <p>Không tìm thấy kết quả nào.</p>
      </div>
    )
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const learned = isLearned(item.id)
        return (
          <li
            key={item.id}
            className={`group flex items-center gap-4 rounded-2xl border bg-white p-4 transition
              ${learned ? 'border-emerald-200 bg-emerald-50/60' : 'border-slate-100 hover:border-brand-100 hover:shadow-card'}`}
          >
            <button
              onClick={() => speak(item.chinese)}
              title="Nghe phát âm"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-brand-100 hover:text-brand-600"
            >
              🔊
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-cn text-2xl font-medium leading-tight text-slate-900">
                  {item.chinese}
                </span>
                <span className="text-sm font-medium text-brand-600">{item.pinyin}</span>
                {item.type && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">
                    {item.type}
                  </span>
                )}
              </div>
              <p className="mt-0.5 truncate text-sm text-slate-500">{item.vietnamese}</p>
            </div>

            <label className="flex shrink-0 cursor-pointer select-none items-center gap-2">
              <input
                type="checkbox"
                checked={learned}
                onChange={() => onToggle(item.id)}
                className="peer sr-only"
              />
              <span
                className="flex h-6 w-6 items-center justify-center rounded-md border-2 border-slate-300 text-white transition
                  peer-checked:border-emerald-500 peer-checked:bg-emerald-500"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path
                    fillRule="evenodd"
                    d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 011.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              <span className="hidden text-xs text-slate-400 sm:inline">Đã thuộc</span>
            </label>
          </li>
        )
      })}
    </ul>
  )
}
