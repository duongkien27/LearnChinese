# 学中文 · Học Tiếng Trung

Ứng dụng web một trang (SPA) để học tiếng Trung: **300 từ vựng cơ bản** (chia 6 nhóm ~50 từ) và **100 câu giao tiếp cơ bản**. Không cần backend — toàn bộ dữ liệu nằm trong `public/data.json`.

## Tính năng

- **7 tab nội dung**: 6 nhóm từ vựng (Phần 1–6, mỗi phần ~50 từ, xếp theo pinyin) + 100 câu giao tiếp — thanh tab cuộn ngang.
- **Từ loại**: mỗi từ hiển thị từ loại (động từ, danh từ, tính từ…) trong danh sách, thẻ ghi nhớ và bài kiểm tra.
- **Tìm kiếm** theo chữ Hán, pinyin hoặc nghĩa tiếng Việt.
- **3 chế độ học**:
  - 📖 **Danh sách** — duyệt và tích "đã thuộc".
  - 🃏 **Thẻ ghi nhớ (Flashcard)** — hiện chữ Hán, nhấn để lật ra pinyin + nghĩa.
  - 🎯 **Kiểm tra (Test Yourself)** — ẩn đáp án, tự nhớ rồi hiện ra và tự chấm.
- **Theo dõi tiến độ** — mục "đã thuộc" được lưu trong `localStorage`, giữ lại sau khi tắt trình duyệt.
- **Phát âm** — dùng SpeechSynthesis của trình duyệt (nút 🔊), thay cho file audio.
- Giao diện tối giản, chữ Hán rõ nét (font **Noto Sans SC**), responsive ưu tiên mobile.

## Công nghệ

React (Vite) + Tailwind CSS · state bằng `useState` / `useEffect` · lưu trữ `localStorage`.

## Chạy dự án

```bash
npm install      # cài dependencies
npm run dev      # chạy dev server → http://localhost:5173
npm run build    # build production vào dist/
npm run preview  # xem thử bản build
```

## Cấu trúc dữ liệu (`public/data.json`)

`groups` (6 nhóm từ vựng, mỗi nhóm có `key`, `label`, `sub`, `items`) và `sentences` (100 câu). Mỗi mục:

```json
{
  "id": "v-001",
  "chinese": "爱",
  "pinyin": "ài",
  "type": "động từ",
  "vietnamese": "yêu, thích",
  "audio": null,
  "category": "g1"
}
```

`type` là từ loại; `audio` là chỗ dành sẵn (placeholder) — hiện phát âm được tạo trực tiếp bằng trình duyệt. Muốn thêm/sửa nội dung hay chia lại nhóm, chỉ cần sửa `data.json` (giao diện tự dựng tab theo `groups`).

## Cấu trúc thư mục

```
src/
  App.jsx                # bố cục, tab, tìm kiếm, chuyển chế độ, tiến độ
  components/
    DataList.jsx         # chế độ danh sách + tích "đã thuộc"
    Flashcard.jsx        # thẻ lật 3D
    QuizPanel.jsx        # chế độ tự kiểm tra
  hooks/
    useLearned.js        # quản lý tiến độ, lưu localStorage
  utils/
    speak.js             # phát âm tiếng Trung (SpeechSynthesis)
public/
  data.json             # toàn bộ nội dung học
```
