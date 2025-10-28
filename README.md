# 🎬 CineHub - Website Xem Phim

Website xem phim hiện đại với đầy đủ tính năng quản lý phim, đánh giá và danh sách yêu thích.

## ✨ Tính năng

### 🎥 Quản lý Phim
- Xem danh sách phim với giao diện đẹp mắt
- Tìm kiếm phim theo tên
- Lọc phim theo thể loại (Action, Drama, Sci-Fi, Comedy, v.v.)
- Xem chi tiết phim với trailer YouTube/Vimeo
- Hiển thị thông tin: poster, mô tả, năm phát hành, thời lượng, đánh giá

### 👤 Tài khoản Người dùng
- Đăng ký tài khoản mới
- Đăng nhập/Đăng xuất
- Quản lý profile cá nhân

### ❤️ Yêu thích & Lịch sử
- Thêm/xóa phim khỏi danh sách yêu thích
- Tự động lưu lịch sử xem
- Xem lại danh sách yêu thích và lịch sử trong trang Profile

### ⭐ Đánh giá & Bình luận
- Đánh giá phim từ 1-5 sao
- Viết bình luận về phim
- Xem đánh giá của người dùng khác
- Cập nhật điểm trung bình cho mỗi phim

## 🛠️ Công nghệ

### Backend
- **FastAPI** - Python web framework
- **MongoDB** - NoSQL database
- **Motor** - Async MongoDB driver
- **JWT** - Authentication
- **Bcrypt** - Password hashing

### Frontend
- **React 19** - UI framework
- **React Router** - Navigation
- **Tailwind CSS** - Styling
- **Shadcn/UI** - Components
- **Axios** - HTTP client

## 🚀 Demo

Live: https://screenhub-130.preview.emergentagent.com

## 📦 Cài đặt

Bạn có thể xem mã nguồn tại GitHub: https://github.com/QuangHai-CaManNgu/new

Và thử nghiệm bản demo tại: https://screenhub-130.preview.emergentagent.com

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn server:app --reload --port 8001
```

### Frontend
```bash
cd frontend
yarn install
yarn start
```

### Khởi tạo Mock Data
```bash
curl -X POST http://localhost:8001/api/init-data
```

## 👨‍💻 Author

Built with ❤️ for movie lovers
