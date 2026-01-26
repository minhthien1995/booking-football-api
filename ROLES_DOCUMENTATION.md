# 👥 HỆ THỐNG PHÂN QUYỀN (ROLE SYSTEM)

## 📋 Tổng quan

Hệ thống có 3 loại người dùng (roles):

### 1. 🔴 Superadmin (Quản trị tối cao)
- **Quyền hạn cao nhất** trong hệ thống
- Quản lý tất cả Admin users
- Xem toàn bộ thống kê hệ thống
- Truy cập tất cả chức năng

**Tài khoản mặc định:**
- Email: `superadmin@footballbooking.com`
- Password: `superadmin123`

### 2. 🟡 Admin (Quản lý)
- Được **phân quyền bởi Superadmin**
- Quản lý sân bóng (CRUD)
- Quản lý bookings của khách hàng
- Xem thống kê
- **KHÔNG** được quản lý Admin users khác

**Tài khoản mẫu:**
- Email: `admin1@footballbooking.com` / `123456`
- Email: `admin2@footballbooking.com` / `123456`

### 3. 🟢 Customer (Khách hàng)
- Người dùng thông thường
- Đăng ký và đặt sân
- Xem lịch sử booking của mình
- Hủy booking của mình

**Tài khoản mẫu:**
- Email: `nguyenvana@example.com` / `123456`
- Email: `tranthib@example.com` / `123456`

---

## 🎯 Ma trận phân quyền

| Tính năng | Superadmin | Admin | Customer |
|-----------|:----------:|:-----:|:--------:|
| **Authentication** |
| Đăng ký | ✅ | ✅ | ✅ |
| Đăng nhập | ✅ | ✅ | ✅ |
| Đổi mật khẩu | ✅ | ✅ | ✅ |
| **Quản lý Admin Users** |
| Xem danh sách Admin | ✅ | ❌ | ❌ |
| Tạo Admin mới | ✅ | ❌ | ❌ |
| Cập nhật Admin | ✅ | ❌ | ❌ |
| Xóa Admin | ✅ | ❌ | ❌ |
| **Quản lý Customers** |
| Xem danh sách Customer | ✅ | ✅ | ❌ |
| Cập nhật Customer | ✅ | ✅ | ❌ |
| Xóa Customer | ✅ | ✅ | ❌ |
| **Quản lý Sân bóng** |
| Xem danh sách sân | ✅ | ✅ | ✅ |
| Tạo sân mới | ✅ | ✅ | ❌ |
| Cập nhật sân | ✅ | ✅ | ❌ |
| Xóa sân | ✅ | ✅ | ❌ |
| **Booking** |
| Đặt sân | ✅ | ✅ | ✅ |
| Xem booking của mình | ✅ | ✅ | ✅ |
| Xem tất cả bookings | ✅ | ✅ | ❌ |
| Cập nhật booking | ✅ | ✅ | ✅* |
| Hủy booking | ✅ | ✅ | ✅* |
| Cập nhật trạng thái thanh toán | ✅ | ✅ | ❌ |
| **Thống kê** |
| Thống kê hệ thống | ✅ | ✅ | ❌ |

*Customer chỉ có thể cập nhật/hủy booking của mình

---

## 📡 API Endpoints theo Role

### Superadmin Endpoints

```
# Quản lý Admin users
GET    /api/superadmin/admins          # Danh sách Admin
POST   /api/superadmin/admins          # Tạo Admin mới
PUT    /api/superadmin/admins/:id      # Cập nhật Admin
DELETE /api/superadmin/admins/:id      # Xóa Admin

# Quản lý Customers
GET    /api/superadmin/customers       # Danh sách Customer

# Thống kê hệ thống
GET    /api/superadmin/stats           # Thống kê toàn hệ thống
```

### Admin Endpoints

```
# Quản lý Users (Customers only)
GET    /api/admin/users                # Danh sách users
GET    /api/admin/users/:id            # Chi tiết user
PUT    /api/admin/users/:id            # Cập nhật user
DELETE /api/admin/users/:id            # Xóa user

# Thống kê
GET    /api/admin/stats                # Thống kê
```

### Common Endpoints (All roles)

```
# Authentication
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
PUT    /api/auth/profile
PUT    /api/auth/change-password

# Fields (Read for all, Write for Admin/Superadmin)
GET    /api/fields
GET    /api/fields/:id
POST   /api/fields                     # Admin/Superadmin only
PUT    /api/fields/:id                 # Admin/Superadmin only
DELETE /api/fields/:id                 # Admin/Superadmin only

# Bookings
GET    /api/bookings/available-slots/:fieldId/:date
POST   /api/bookings
GET    /api/bookings
GET    /api/bookings/:id
PUT    /api/bookings/:id
PUT    /api/bookings/:id/cancel
```

---

## 🔐 Cách sử dụng

### 1. Đăng nhập với Superadmin

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@footballbooking.com",
    "password": "superadmin123"
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "role": "superadmin",
      ...
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. Tạo Admin user (Superadmin only)

```bash
curl -X POST http://localhost:5000/api/superadmin/admins \
  -H "Authorization: Bearer YOUR_SUPERADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Quản lý 3",
    "email": "admin3@footballbooking.com",
    "password": "123456",
    "phone": "0907777777"
  }'
```

### 3. Xem danh sách Admin users (Superadmin only)

```bash
curl http://localhost:5000/api/superadmin/admins \
  -H "Authorization: Bearer YOUR_SUPERADMIN_TOKEN"
```

### 4. Admin quản lý sân bóng

```bash
# Tạo sân mới
curl -X POST http://localhost:5000/api/fields \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sân mới",
    "fieldType": "5vs5",
    "location": "123 ABC Street",
    "pricePerHour": 300000,
    "openTime": "06:00",
    "closeTime": "23:00"
  }'
```

### 5. Customer đặt sân

```bash
curl -X POST http://localhost:5000/api/bookings \
  -H "Authorization: Bearer CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fieldId": 1,
    "bookingDate": "2024-02-01",
    "startTime": "18:00",
    "duration": 2
  }'
```

---

## 🛡️ Bảo mật

### Middleware Authorization

File: `middleware/auth.js`

```javascript
// Cho phép nhiều roles
router.use(authorize('admin', 'superadmin'));

// Chỉ cho phép 1 role
router.use(authorize('superadmin'));
```

### Kiểm tra role trong Controller

```javascript
// Chỉ admin/superadmin mới được update status
if (status && (req.user.role === 'admin' || req.user.role === 'superadmin')) {
  booking.status = status;
}
```

---

## 📝 Workflow thực tế

### Workflow 1: Khởi tạo hệ thống

1. **Superadmin** đăng nhập lần đầu
2. **Superadmin** tạo các Admin users
3. **Admin** đăng nhập và tạo các sân bóng
4. **Customers** đăng ký và bắt đầu đặt sân

### Workflow 2: Quản lý hàng ngày

1. **Customer** đặt sân → Trạng thái: `pending`
2. **Admin** xem booking → Xác nhận → Trạng thái: `confirmed`
3. **Customer** đến sân → **Admin** cập nhật → Trạng thái: `completed`
4. **Admin** cập nhật thanh toán → `paymentStatus`: `paid`

### Workflow 3: Quản lý Admin

1. **Superadmin** cần thêm quản lý mới
2. **Superadmin** tạo Admin user mới qua `/api/superadmin/admins`
3. Admin mới nhận thông tin đăng nhập
4. Admin mới đăng nhập và bắt đầu quản lý sân/bookings
5. Nếu cần, **Superadmin** có thể vô hiệu hóa Admin: `isActive: false`

---

## 🧪 Testing với Postman

### 1. Import Postman Collection
File: `postman_collection.json`

### 2. Biến môi trường

Tạo 3 biến:
- `superadmin_token` - Token của Superadmin
- `admin_token` - Token của Admin
- `customer_token` - Token của Customer

### 3. Test flow

```
1. Login as Superadmin → Lưu token
2. Create Admin user
3. Login as Admin → Lưu token
4. Create Field
5. Register as Customer → Lưu token
6. Create Booking
7. Admin update booking status
```

---

## ⚠️ Lưu ý quan trọng

1. **Không được xóa Superadmin**: Hệ thống nên luôn có ít nhất 1 Superadmin
2. **Admin không thể tự thăng cấp**: Chỉ Superadmin mới có thể tạo/quản lý Admin
3. **Customer không thể truy cập endpoint admin**: Middleware sẽ chặn
4. **Token hết hạn sau 7 ngày**: Cần đăng nhập lại

---

## 📊 Thống kê theo Role

### Superadmin Statistics
```json
{
  "users": {
    "superadmins": 1,
    "admins": 2,
    "customers": 4,
    "total": 7
  },
  "totalFields": 6,
  "totalBookings": 5,
  "totalRevenue": "2050000.00"
}
```

### Admin Statistics
```json
{
  "totalUsers": 4,
  "totalFields": 6,
  "totalBookings": 5,
  "totalRevenue": "2050000.00"
}
```

---

Made with ❤️ for better role management
