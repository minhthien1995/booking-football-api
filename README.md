# ⚽ Football Field Booking System - Backend

Hệ thống quản lý đặt sân bóng đá được xây dựng với Node.js, Express.js và MySQL.

## 🚀 Tính năng

### Người dùng (User)
- ✅ Đăng ký và đăng nhập
- ✅ Quản lý thông tin cá nhân
- ✅ Xem danh sách sân bóng
- ✅ Đặt sân theo giờ
- ✅ Xem lịch sử đặt sân
- ✅ Hủy đặt sân
- ✅ Xem khung giờ trống của sân

### Quản trị viên (Admin)
- ✅ Quản lý người dùng (CRUD)
- ✅ Quản lý sân bóng (CRUD)
- ✅ Quản lý đơn đặt sân
- ✅ Thống kê doanh thu
- ✅ Cập nhật trạng thái đơn đặt và thanh toán

## 🛠️ Công nghệ sử dụng

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL
- **ORM**: Sequelize
- **Authentication**: JWT (JSON Web Token)
- **Validation**: express-validator
- **Password Hashing**: bcryptjs
- **Date Handling**: moment

## 📋 Yêu cầu hệ thống

- Node.js v14 trở lên
- MySQL v5.7 trở lên
- npm hoặc yarn

## ⚙️ Cài đặt

### 🐳 Cách 1: Sử dụng Docker (Khuyến nghị - Dễ nhất)

```bash
# 1. Chạy tất cả với Docker
docker compose up -d

# 2. Seed dữ liệu mẫu
docker compose exec backend node seed.js

# Hoặc dùng Makefile (dễ hơn):
make up      # Khởi động
make seed    # Seed dữ liệu
make logs    # Xem logs
```

✅ **Xong!** Backend chạy tại `http://localhost:5000`, phpMyAdmin tại `http://localhost:8080`

📖 Xem hướng dẫn chi tiết: [DOCKER_GUIDE.md](DOCKER_GUIDE.md)

---

### 💻 Cách 2: Cài đặt thủ công (Traditional)

### 1. Clone repository

```bash
git clone <repository-url>
cd football-booking-backend
```

### 2. Cài đặt dependencies

```bash
npm install
```

### 3. Tạo database MySQL

Đăng nhập vào MySQL và chạy lệnh:

```sql
CREATE DATABASE football_booking CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Cấu hình môi trường

Tạo file `.env` từ file mẫu:

```bash
cp .env.example .env
```

Cập nhật thông tin trong file `.env`:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=football_booking
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d

# Admin Configuration
ADMIN_EMAIL=admin@footballbooking.com
ADMIN_PASSWORD=admin123
```

### 5. Chạy ứng dụng

**Development mode:**

```bash
npm run dev
```

**Production mode:**

```bash
npm start
```

Server sẽ chạy tại: `http://localhost:5000`

## 📚 API Documentation

### Authentication Endpoints

#### Đăng ký
```http
POST /api/auth/register
Content-Type: application/json

{
  "fullName": "Nguyễn Văn A",
  "email": "user@example.com",
  "password": "123456",
  "phone": "0901234567"
}
```

#### Đăng nhập
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "123456"
}
```

#### Lấy thông tin user hiện tại
```http
GET /api/auth/me
Authorization: Bearer {token}
```

#### Cập nhật thông tin cá nhân
```http
PUT /api/auth/profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "fullName": "Nguyễn Văn B",
  "phone": "0907654321"
}
```

#### Đổi mật khẩu
```http
PUT /api/auth/change-password
Authorization: Bearer {token}
Content-Type: application/json

{
  "currentPassword": "123456",
  "newPassword": "newpass123"
}
```

### Field Endpoints

#### Lấy danh sách sân
```http
GET /api/fields
GET /api/fields?fieldType=5vs5
GET /api/fields?isActive=true
GET /api/fields?search=Sân ABC
```

#### Lấy chi tiết sân
```http
GET /api/fields/:id
```

#### Tạo sân mới (Admin only)
```http
POST /api/fields
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "name": "Sân bóng ABC",
  "fieldType": "5vs5",
  "location": "123 Đường XYZ, Q.1, TP.HCM",
  "pricePerHour": 300000,
  "description": "Sân cỏ nhân tạo chất lượng cao",
  "image": "https://example.com/image.jpg",
  "openTime": "06:00",
  "closeTime": "23:00"
}
```

#### Cập nhật sân (Admin only)
```http
PUT /api/fields/:id
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "name": "Sân bóng XYZ",
  "pricePerHour": 350000
}
```

#### Xóa sân (Admin only)
```http
DELETE /api/fields/:id
Authorization: Bearer {admin_token}
```

### Booking Endpoints

#### Xem khung giờ trống
```http
GET /api/bookings/available-slots/:fieldId/:date
# Ví dụ: GET /api/bookings/available-slots/1/2024-01-27
```

#### Tạo đơn đặt sân
```http
POST /api/bookings
Authorization: Bearer {token}
Content-Type: application/json

{
  "fieldId": 1,
  "bookingDate": "2024-01-27",
  "startTime": "18:00",
  "duration": 2,
  "notes": "Đặt sân cho đội bóng ABC"
}
```

#### Lấy danh sách đơn đặt
```http
GET /api/bookings
GET /api/bookings?status=pending
GET /api/bookings?paymentStatus=paid
GET /api/bookings?fieldId=1
GET /api/bookings?startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer {token}
```

#### Lấy chi tiết đơn đặt
```http
GET /api/bookings/:id
Authorization: Bearer {token}
```

#### Cập nhật đơn đặt
```http
PUT /api/bookings/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "bookingDate": "2024-01-28",
  "startTime": "19:00",
  "duration": 2,
  "paymentMethod": "momo"
}
```

#### Hủy đơn đặt
```http
PUT /api/bookings/:id/cancel
Authorization: Bearer {token}
```

### Admin Endpoints

#### Lấy danh sách người dùng
```http
GET /api/admin/users
GET /api/admin/users?role=user
GET /api/admin/users?isActive=true
GET /api/admin/users?search=Nguyễn
Authorization: Bearer {admin_token}
```

#### Lấy thông tin người dùng
```http
GET /api/admin/users/:id
Authorization: Bearer {admin_token}
```

#### Cập nhật người dùng
```http
PUT /api/admin/users/:id
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "role": "admin",
  "isActive": false
}
```

#### Xóa người dùng
```http
DELETE /api/admin/users/:id
Authorization: Bearer {admin_token}
```

#### Lấy thống kê
```http
GET /api/admin/stats
Authorization: Bearer {admin_token}
```

## 📊 Database Schema

### Users Table
```sql
- id (INT, PK, AUTO_INCREMENT)
- full_name (VARCHAR)
- email (VARCHAR, UNIQUE)
- password (VARCHAR)
- phone (VARCHAR)
- role (ENUM: 'user', 'admin')
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Fields Table
```sql
- id (INT, PK, AUTO_INCREMENT)
- name (VARCHAR)
- field_type (ENUM: '5vs5', '7vs7', '11vs11')
- location (VARCHAR)
- price_per_hour (DECIMAL)
- description (TEXT)
- image (VARCHAR)
- is_active (BOOLEAN)
- open_time (TIME)
- close_time (TIME)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Bookings Table
```sql
- id (INT, PK, AUTO_INCREMENT)
- user_id (INT, FK -> users.id)
- field_id (INT, FK -> fields.id)
- booking_date (DATE)
- start_time (TIME)
- end_time (TIME)
- duration (INT)
- total_price (DECIMAL)
- status (ENUM: 'pending', 'confirmed', 'cancelled', 'completed')
- payment_status (ENUM: 'unpaid', 'paid', 'refunded')
- payment_method (ENUM: 'cash', 'bank_transfer', 'momo', 'vnpay')
- notes (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

## 🔐 Bảo mật

- Mật khẩu được hash bằng bcryptjs
- Authentication sử dụng JWT
- Protected routes yêu cầu token hợp lệ
- Role-based access control (User/Admin)
- Validation input dữ liệu

## 🧪 Testing API

Bạn có thể test API bằng:
- Postman
- Thunder Client (VS Code Extension)
- curl
- Hoặc tạo frontend để kết nối

## 📝 Ghi chú

1. **Tạo admin user đầu tiên**: Sau khi chạy server lần đầu, bạn cần tạo admin user bằng cách đăng ký một user thông thường, sau đó vào database và thay đổi `role` thành `admin`:

```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
```

2. **Sync database**: Sequelize sẽ tự động tạo các bảng khi chạy lần đầu. Nếu cần reset database, xóa các bảng và chạy lại server.

3. **Timezone**: Server sử dụng timezone +07:00 (Việt Nam).

## 🚧 Tính năng sắp tới

- [ ] Upload hình ảnh sân
- [ ] Tích hợp payment gateway (VNPay, Momo)
- [ ] Gửi email xác nhận đặt sân
- [ ] Đánh giá và review sân
- [ ] Hệ thống khuyến mãi
- [ ] Báo cáo thống kê chi tiết

## 🤝 Đóng góp

Mọi đóng góp đều được chào đón! Vui lòng tạo pull request hoặc báo lỗi qua Issues.

## 📄 License

MIT License

---

Made with ❤️ by [Your Name]
