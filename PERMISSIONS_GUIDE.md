# 🔐 HỆ THỐNG PHÂN QUYỀN CHI TIẾT (Permission System)

## 📋 Tổng quan

Hệ thống phân quyền linh hoạt cho phép **Superadmin** tùy chỉnh quyền hạn cụ thể cho từng **Admin**.

### Kiến trúc:
```
Superadmin
    ↓
  Admins (có thể custom permissions)
    ↓
 Customers
```

---

## 🎯 Danh sách Permissions

### 📍 FIELDS (Quản lý sân)

| Permission | Tên hiển thị | Mô tả |
|-----------|--------------|-------|
| `view_fields` | Xem danh sách sân | Xem tất cả sân bóng trong hệ thống |
| `create_fields` | Tạo sân mới | Thêm sân bóng mới vào hệ thống |
| `edit_fields` | Chỉnh sửa sân | Cập nhật thông tin sân bóng |
| `delete_fields` | Xóa sân | Xóa sân bóng khỏi hệ thống |

### 📅 BOOKINGS (Quản lý đặt sân)

| Permission | Tên hiển thị | Mô tả |
|-----------|--------------|-------|
| `view_all_bookings` | Xem tất cả booking | Xem tất cả đơn đặt sân của mọi người |
| `create_bookings` | Tạo booking | Tạo đơn đặt sân cho khách hàng |
| `edit_bookings` | Chỉnh sửa booking | Cập nhật thông tin đơn đặt sân |
| `cancel_bookings` | Hủy booking | Hủy đơn đặt sân của khách hàng |
| `update_booking_status` | Cập nhật trạng thái booking | Thay đổi trạng thái (pending/confirmed/completed/cancelled) |
| `update_payment_status` | Cập nhật trạng thái thanh toán | Thay đổi trạng thái thanh toán (unpaid/paid/refunded) |

### 👥 USERS (Quản lý người dùng)

| Permission | Tên hiển thị | Mô tả |
|-----------|--------------|-------|
| `view_customers` | Xem danh sách khách hàng | Xem thông tin khách hàng |
| `edit_customers` | Chỉnh sửa khách hàng | Cập nhật thông tin khách hàng |
| `delete_customers` | Xóa khách hàng | Xóa tài khoản khách hàng |
| `activate_deactivate_users` | Kích hoạt/Vô hiệu hóa user | Bật/tắt trạng thái active |

### 📊 STATS (Thống kê)

| Permission | Tên hiển thị | Mô tả |
|-----------|--------------|-------|
| `view_stats` | Xem thống kê | Xem báo cáo và thống kê hệ thống |
| `view_revenue` | Xem doanh thu | Xem thống kê doanh thu |

### ⚙️ SETTINGS (Cài đặt)

| Permission | Tên hiển thị | Mô tả |
|-----------|--------------|-------|
| `manage_settings` | Quản lý cài đặt | Thay đổi cài đặt hệ thống |

---

## 🚀 Setup và Sử dụng

### Bước 1: Seed Permissions

```bash
# Chạy script để tạo tất cả permissions
docker compose exec backend node seed-permissions.js

# Hoặc
make seed-permissions
```

Output:
```
🔑 Starting permissions seeding...
✅ Database connected
✅ Permission model synced
✅ 17 permissions in database

📋 Available Permissions:

🔹 FIELDS:
   - view_fields          → Xem danh sách sân
   - create_fields        → Tạo sân mới
   - edit_fields          → Chỉnh sửa sân
   - delete_fields        → Xóa sân

🔹 BOOKINGS:
   - view_all_bookings    → Xem tất cả booking
   ...
```

### Bước 2: Seed Users

```bash
docker compose exec backend node seed.js
```

### Bước 3: Phân quyền cho Admin

---

## 📡 API Endpoints

### 1. Xem tất cả permissions có sẵn

```bash
GET /api/permissions
Authorization: Bearer {superadmin_token}
```

Response:
```json
{
  "success": true,
  "count": 17,
  "data": {
    "fields": [
      {
        "id": 1,
        "name": "view_fields",
        "displayName": "Xem danh sách sân",
        "description": "Xem tất cả sân bóng trong hệ thống",
        "category": "fields",
        "isActive": true
      },
      ...
    ],
    "bookings": [...],
    "users": [...],
    "stats": [...],
    "settings": [...]
  }
}
```

### 2. Xem permissions của một Admin

```bash
GET /api/permissions/user/:userId
Authorization: Bearer {superadmin_token}
```

Response:
```json
{
  "success": true,
  "data": {
    "userId": 2,
    "fullName": "Quản lý 1",
    "email": "admin1@footballbooking.com",
    "role": "admin",
    "permissionsCount": 4,
    "permissions": [
      {
        "id": 1,
        "permission": {
          "name": "view_fields",
          "displayName": "Xem danh sách sân"
        },
        "grantor": {
          "id": 1,
          "fullName": "Super Admin",
          "email": "superadmin@footballbooking.com"
        },
        "grantedAt": "2024-01-26T10:00:00.000Z"
      },
      ...
    ]
  }
}
```

### 3. Phân quyền đơn lẻ cho Admin

```bash
POST /api/permissions/grant
Authorization: Bearer {superadmin_token}
Content-Type: application/json

{
  "userId": 2,
  "permissionId": 1
}
```

Response:
```json
{
  "success": true,
  "message": "Phân quyền thành công",
  "data": {
    "userId": 2,
    "permissionId": 1,
    "grantedBy": 1,
    "permission": {
      "name": "view_fields",
      "displayName": "Xem danh sách sân"
    }
  }
}
```

### 4. Phân quyền nhiều permissions cùng lúc

```bash
POST /api/permissions/grant-multiple
Authorization: Bearer {superadmin_token}
Content-Type: application/json

{
  "userId": 2,
  "permissionIds": [1, 2, 3, 4, 5]
}
```

Response:
```json
{
  "success": true,
  "message": "Đã phân quyền 5 quyền mới",
  "data": {
    "granted": 5,
    "skipped": 0,
    "total": 5
  }
}
```

### 5. Đồng bộ permissions (thay thế toàn bộ)

```bash
POST /api/permissions/sync/:userId
Authorization: Bearer {superadmin_token}
Content-Type: application/json

{
  "permissionIds": [1, 2, 5, 6, 11]
}
```

**Chức năng:** Xóa tất cả permissions cũ và gán bộ permissions mới.

### 6. Thu hồi một permission

```bash
DELETE /api/permissions/revoke
Authorization: Bearer {superadmin_token}
Content-Type: application/json

{
  "userId": 2,
  "permissionId": 4
}
```

### 7. Thu hồi tất cả permissions

```bash
DELETE /api/permissions/revoke-all/:userId
Authorization: Bearer {superadmin_token}
```

---

## 🎭 Các kịch bản thực tế

### Kịch bản 1: Admin chỉ quản lý sân

**Mục tiêu:** Admin chỉ được xem, thêm, sửa sân. Không xóa sân, không quản lý booking.

```bash
# Login superadmin
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@footballbooking.com","password":"superadmin123"}' \
  | jq -r '.data.token')

# Phân quyền
curl -X POST http://localhost:5000/api/permissions/grant-multiple \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 2,
    "permissionIds": [1, 2, 3]
  }'
```

Permissions được gán:
- `view_fields` (1)
- `create_fields` (2)
- `edit_fields` (3)

### Kịch bản 2: Admin chỉ quản lý booking

**Mục tiêu:** Admin chỉ xem và cập nhật trạng thái booking. Không tạo/xóa sân.

```bash
curl -X POST http://localhost:5000/api/permissions/sync/2 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "permissionIds": [5, 7, 9, 10]
  }'
```

Permissions được gán:
- `view_all_bookings` (5)
- `edit_bookings` (7)
- `update_booking_status` (9)
- `update_payment_status` (10)

### Kịch bản 3: Admin toàn quyền

**Mục tiêu:** Admin có tất cả quyền (giống superadmin).

```bash
# Lấy tất cả permission IDs
PERM_IDS=$(curl -s http://localhost:5000/api/permissions \
  -H "Authorization: Bearer $TOKEN" \
  | jq '[.data[][] | .id]')

# Gán tất cả
curl -X POST http://localhost:5000/api/permissions/sync/2 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"permissionIds\": $PERM_IDS}"
```

### Kịch bản 4: Admin thực tập (chỉ xem)

**Mục tiêu:** Admin mới, chỉ được xem, không được thao tác gì.

```bash
curl -X POST http://localhost:5000/api/permissions/sync/3 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "permissionIds": [1, 5, 11, 15]
  }'
```

Permissions:
- `view_fields` (1)
- `view_all_bookings` (5)
- `view_customers` (11)
- `view_stats` (15)

---

## 🛡️ Cách hoạt động trong Code

### Trong Route (Recommended)

```javascript
const { checkPermission } = require('../middleware/permission');

router.post(
  '/fields',
  protect,
  authorize('admin', 'superadmin'),
  checkPermission('create_fields'), // Kiểm tra permission
  createField
);
```

### Trong Controller (Alternative)

```javascript
const { hasPermission } = require('../middleware/permission');

exports.deleteField = async (req, res) => {
  // Kiểm tra permission
  if (req.user.role !== 'superadmin') {
    const canDelete = await hasPermission(req.user.id, 'delete_fields');
    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xóa sân'
      });
    }
  }
  
  // Proceed with deletion...
};
```

### Nhiều Permissions (OR logic)

```javascript
const { checkAnyPermission } = require('../middleware/permission');

router.put(
  '/bookings/:id',
  protect,
  checkAnyPermission(['edit_bookings', 'update_booking_status']),
  updateBooking
);
```

---

## 📊 Database Schema

### permissions table
```sql
- id (INT, PK)
- name (VARCHAR, UNIQUE)
- display_name (VARCHAR)
- description (VARCHAR)
- category (ENUM: fields, bookings, users, stats, settings)
- is_active (BOOLEAN)
- created_at, updated_at
```

### user_permissions table (junction)
```sql
- id (INT, PK)
- user_id (INT, FK -> users.id)
- permission_id (INT, FK -> permissions.id)
- granted_by (INT, FK -> users.id)
- granted_at (TIMESTAMP)
- UNIQUE(user_id, permission_id)
```

---

## 🧪 Testing

### Test 1: Admin với quyền tạo sân

```bash
# Login admin
ADMIN_TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin1@footballbooking.com","password":"123456"}' \
  | jq -r '.data.token')

# Thử tạo sân (sẽ fail nếu chưa có permission)
curl -X POST http://localhost:5000/api/fields \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sân test",
    "fieldType": "5vs5",
    "location": "Test location",
    "pricePerHour": 300000
  }'
```

**Nếu chưa có quyền:**
```json
{
  "success": false,
  "message": "Bạn không có quyền thực hiện hành động này",
  "requiredPermissions": ["create_fields"]
}
```

**Sau khi Superadmin phân quyền:**
```json
{
  "success": true,
  "message": "Tạo sân thành công",
  "data": { ... }
}
```

---

## 💡 Best Practices

1. **Principle of Least Privilege**: Chỉ gán quyền cần thiết
2. **Regular Audit**: Định kỳ review permissions của admin
3. **Document Changes**: Ghi chú lý do khi phân quyền
4. **Revoke on Leave**: Thu hồi quyền khi admin nghỉ việc
5. **Use Sync for Templates**: Tạo template permissions cho các vai trò cụ thể

---

## 🔄 Migration từ hệ thống cũ

Nếu bạn đã có admin users, cần:

1. **Chạy seed-permissions.js** để tạo permissions
2. **Quyết định permissions mặc định** cho admin hiện tại
3. **Chạy script phân quyền hàng loạt:**

```javascript
// assign-default-permissions.js
const admins = [2, 3]; // Admin user IDs
const defaultPerms = [1, 2, 3, 5, 9, 10, 11, 15]; // Permission IDs

for (const adminId of admins) {
  await syncUserPermissions(adminId, defaultPerms);
}
```

---

## 📞 Support

Để thêm permission mới:
1. Thêm vào `seed-permissions.js`
2. Chạy lại `node seed-permissions.js`
3. Update routes với permission middleware

---

Made with 🔐 for granular access control
