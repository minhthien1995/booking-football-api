# 🚀 Hướng dẫn khởi động nhanh

## Bước 1: Cài đặt MySQL

Đảm bảo bạn đã cài đặt MySQL. Nếu chưa:
- **Windows**: Tải từ https://dev.mysql.com/downloads/installer/
- **macOS**: `brew install mysql`
- **Linux**: `sudo apt-get install mysql-server`

## Bước 2: Tạo Database

```bash
# Đăng nhập MySQL
mysql -u root -p

# Tạo database
CREATE DATABASE football_booking CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Thoát MySQL
exit;
```

## Bước 3: Cài đặt Dependencies

```bash
npm install
```

## Bước 4: Cấu hình môi trường

```bash
# Copy file cấu hình mẫu
cp .env.example .env

# Mở file .env và cập nhật thông tin database của bạn
```

**Quan trọng**: Cập nhật các thông tin sau trong file `.env`:
- `DB_PASSWORD`: Mật khẩu MySQL của bạn
- `JWT_SECRET`: Đổi thành một chuỗi bí mật khác

## Bước 5: Seed dữ liệu mẫu (Tùy chọn)

```bash
node seed.js
```

Script này sẽ:
- Tạo bảng trong database
- Tạo 1 admin user
- Tạo 3 user thường
- Tạo 6 sân bóng mẫu
- Tạo 5 booking mẫu

**Lưu ý**: Script này sẽ XÓA tất cả dữ liệu cũ!

## Bước 6: Chạy server

```bash
# Development mode (auto-reload)
npm run dev

# Production mode
npm start
```

Server sẽ chạy tại: http://localhost:5000

## Bước 7: Kiểm tra server

Mở trình duyệt hoặc Postman và truy cập:
```
http://localhost:5000/api/health
```

Bạn sẽ thấy:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-26T10:00:00.000Z"
}
```

## 🎯 Test API với Postman

### 1. Đăng ký user mới
```http
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "fullName": "Test User",
  "email": "test@example.com",
  "password": "123456",
  "phone": "0901234567"
}
```

### 2. Đăng nhập
```http
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "123456"
}
```

Copy `token` từ response để sử dụng cho các request tiếp theo.

### 3. Xem danh sách sân
```http
GET http://localhost:5000/api/fields
```

### 4. Đặt sân (cần token)
```http
POST http://localhost:5000/api/bookings
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "fieldId": 1,
  "bookingDate": "2024-01-30",
  "startTime": "18:00",
  "duration": 2
}
```

## 📝 Tài khoản mẫu (sau khi chạy seed)

**Admin:**
- Email: admin@footballbooking.com
- Password: admin123

**User:**
- Email: nguyenvana@example.com
- Password: 123456

## ❓ Khắc phục sự cố

### Lỗi kết nối database
- Kiểm tra MySQL đã chạy: `mysql -u root -p`
- Kiểm tra thông tin trong `.env` đúng chưa

### Lỗi "Cannot find module"
- Chạy lại: `npm install`

### Lỗi port đã được sử dụng
- Đổi PORT trong file `.env`
- Hoặc kill process đang dùng port 5000

### Reset database
```bash
# Đăng nhập MySQL
mysql -u root -p

# Xóa và tạo lại database
DROP DATABASE football_booking;
CREATE DATABASE football_booking CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Chạy lại seed
node seed.js
```

## 📚 Tài liệu đầy đủ

Xem file `README.md` để biết chi tiết về:
- Tất cả API endpoints
- Database schema
- Tính năng hệ thống
- Bảo mật

## 🎉 Hoàn thành!

Bây giờ bạn có thể:
1. Phát triển frontend để kết nối với API
2. Thêm các tính năng mới
3. Tùy chỉnh theo nhu cầu

Chúc bạn code vui vẻ! 🚀
