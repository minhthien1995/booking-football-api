# 🎭 HỆ THỐNG CUSTOM ROLES (Role-Based Access Control)

## 🎯 Tổng quan

Hệ thống cho phép **Superadmin** tạo các **User Roles** với tập permissions tùy chỉnh, sau đó gán role đó cho Admin users.

### ✅ Ưu điểm so với gán permissions trực tiếp:

| Cách cũ (Permission-based) | Cách mới (Role-based) |
|---------------------------|----------------------|
| Gán từng permission cho từng admin | Tạo role → Gán role cho admin |
| Thêm admin mới → Gán lại tất cả permissions | Thêm admin mới → Gán 1 role |
| Sửa quyền → Sửa từng admin | Sửa quyền → Sửa role (tất cả admin tự động update) |
| Quản lý phức tạp | Quản lý đơn giản |

---

## 🏗️ Kiến trúc

### Database Tables:

```
user_roles (Role tùy chỉnh)
├── id
├── name (customAdmin, fieldManager, ...)
├── display_name
├── description
├── is_active
└── created_by

role_permissions (Permissions của role)
├── role_id → user_roles.id
└── permission_id → permissions.id

users (Cập nhật)
├── role (superadmin/admin/customer)
└── custom_role_id → user_roles.id (nullable)
```

### Flow:

```
1. Superadmin tạo role "customAdmin"
2. Gán permissions cho role: [view_fields, view_all_bookings]
3. Gán role "customAdmin" cho Admin1, Admin2, Admin3
4. Tất cả 3 admin tự động có 2 quyền đó
5. Sửa role → Thêm permission "create_fields"
6. → Admin1, Admin2, Admin3 tự động có thêm quyền mới
```

---

## 📡 API Endpoints

### 1. Lấy danh sách tất cả roles

```bash
GET /api/roles
Authorization: Bearer {superadmin_token}
```

**Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "id": 1,
      "name": "customAdmin",
      "displayName": "Quản lý tùy chỉnh",
      "description": "Admin có quyền xem sân và booking",
      "isActive": true,
      "permissions": [
        { "id": 1, "name": "view_fields", "displayName": "Xem danh sách sân" },
        { "id": 5, "name": "view_all_bookings", "displayName": "Xem tất cả booking" }
      ],
      "users": [
        { "id": 2, "fullName": "Admin 1", "email": "admin1@..." },
        { "id": 3, "fullName": "Admin 2", "email": "admin2@..." }
      ],
      "creator": {
        "id": 1,
        "fullName": "Super Admin",
        "email": "superadmin@..."
      }
    },
    ...
  ]
}
```

### 2. Tạo custom role mới

```bash
POST /api/roles
Authorization: Bearer {superadmin_token}
Content-Type: application/json

{
  "name": "customAdmin",
  "displayName": "Quản lý tùy chỉnh",
  "description": "Admin chỉ xem sân và booking",
  "permissionIds": [1, 5]
}
```

**permissionIds** là danh sách ID của permissions muốn gán.

**Response:**
```json
{
  "success": true,
  "message": "Tạo role thành công",
  "data": {
    "id": 1,
    "name": "customAdmin",
    "displayName": "Quản lý tùy chỉnh",
    "permissions": [...]
  }
}
```

### 3. Cập nhật role

```bash
PUT /api/roles/:id
Authorization: Bearer {superadmin_token}
Content-Type: application/json

{
  "displayName": "Quản lý mới",
  "permissionIds": [1, 2, 3, 5]
}
```

**Lưu ý:** Cập nhật permissions sẽ ảnh hưởng đến TẤT CẢ users có role này.

### 4. Xóa role

```bash
DELETE /api/roles/:id
Authorization: Bearer {superadmin_token}
```

**Lưu ý:** Không thể xóa role đang được users sử dụng.

### 5. Gán role cho admin user

```bash
POST /api/roles/assign
Authorization: Bearer {superadmin_token}
Content-Type: application/json

{
  "userId": 2,
  "roleId": 1
}
```

### 6. Gỡ role khỏi user

```bash
POST /api/roles/unassign
Authorization: Bearer {superadmin_token}
Content-Type: application/json

{
  "userId": 2
}
```

### 7. Nhân bản role (Clone)

```bash
POST /api/roles/:id/clone
Authorization: Bearer {superadmin_token}
Content-Type: application/json

{
  "newName": "customAdmin2",
  "newDisplayName": "Quản lý tùy chỉnh 2"
}
```

Tạo role mới với permissions giống role gốc.

### 8. Xem chi tiết role

```bash
GET /api/roles/:id
Authorization: Bearer {superadmin_token}
```

---

## 🎯 Kịch bản sử dụng

### Scenario 1: Tạo role "Field Manager"

**Mục tiêu:** Admin chỉ quản lý sân, không quản lý booking

```bash
# 1. Login superadmin
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@footballbooking.com","password":"superadmin123"}' \
  | jq -r '.data.token')

# 2. Tạo role
curl -X POST http://localhost:5000/api/roles \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "fieldManager",
    "displayName": "Quản lý sân",
    "description": "Admin quản lý sân bóng",
    "permissionIds": [1, 2, 3, 4]
  }'

# Permission IDs:
# 1 = view_fields
# 2 = create_fields
# 3 = edit_fields
# 4 = delete_fields

# 3. Gán role cho admin
curl -X POST http://localhost:5000/api/roles/assign \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 2,
    "roleId": 1
  }'
```

### Scenario 2: Tạo role "Booking Manager"

```bash
curl -X POST http://localhost:5000/api/roles \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "bookingManager",
    "displayName": "Quản lý đặt sân",
    "description": "Admin quản lý booking",
    "permissionIds": [5, 6, 7, 8, 9, 10]
  }'

# Permission IDs:
# 5 = view_all_bookings
# 6 = create_bookings
# 7 = edit_bookings
# 8 = cancel_bookings
# 9 = update_booking_status
# 10 = update_payment_status
```

### Scenario 3: Tạo role "View Only"

```bash
curl -X POST http://localhost:5000/api/roles \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "viewOnly",
    "displayName": "Chỉ xem",
    "description": "Admin thực tập - chỉ xem",
    "permissionIds": [1, 5, 11, 15]
  }'

# Permission IDs:
# 1 = view_fields
# 5 = view_all_bookings
# 11 = view_customers
# 15 = view_stats
```

### Scenario 4: Tạo role "Full Access"

```bash
# Lấy tất cả permission IDs
PERM_IDS=$(curl -s http://localhost:5000/api/permissions \
  -H "Authorization: Bearer $TOKEN" \
  | jq '[.data[][] | .id]')

curl -X POST http://localhost:5000/api/roles \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"fullAccess\",
    \"displayName\": \"Toàn quyền\",
    \"description\": \"Admin có tất cả quyền\",
    \"permissionIds\": $PERM_IDS
  }"
```

### Scenario 5: Cập nhật permissions cho role

```bash
# Thêm quyền "create_bookings" cho role "viewOnly"
curl -X PUT http://localhost:5000/api/roles/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "permissionIds": [1, 5, 6, 11, 15]
  }'

# Tất cả admin có role "viewOnly" tự động có thêm quyền create_bookings
```

---

## 🔄 Workflow thực tế

### Setup ban đầu:

```
1. Seed permissions → 17 permissions
2. Superadmin login
3. Tạo các roles chuẩn:
   - fieldManager (quản lý sân)
   - bookingManager (quản lý booking)
   - viewOnly (chỉ xem)
   - fullAccess (toàn quyền)
4. Tạo admin users
5. Gán role cho từng admin
```

### Quản lý hàng ngày:

```
Admin mới join:
1. Superadmin tạo admin user
2. Gán role phù hợp
3. Admin tự động có đủ quyền → Làm việc ngay

Thay đổi quyền:
1. Superadmin update role
2. Tất cả admin có role đó tự động update
3. Không cần update từng admin

Admin nghỉ việc:
1. Superadmin unassign role hoặc deactivate user
2. Admin mất hết quyền
```

---

## 💡 So sánh với hệ thống cũ

### Thêm admin mới:

**Cũ (Permission-based):**
```bash
# Phải gán 10 permissions riêng lẻ
POST /api/permissions/grant-multiple
{
  "userId": 5,
  "permissionIds": [1,2,3,4,5,6,7,8,9,10]
}
```

**Mới (Role-based):**
```bash
# Chỉ gán 1 role
POST /api/roles/assign
{
  "userId": 5,
  "roleId": 1
}
```

### Thay đổi quyền cho 10 admins:

**Cũ:**
```bash
# Phải update 10 lần
for i in {2..11}; do
  POST /api/permissions/grant
  {
    "userId": $i,
    "permissionId": 17
  }
done
```

**Mới:**
```bash
# Update role 1 lần → 10 admins tự động update
PUT /api/roles/1
{
  "permissionIds": [1,2,3,4,5,6,7,8,9,10,17]
}
```

---

## 🔍 Kiểm tra permissions

### Admin login và test:

```bash
# 1. Login admin
ADMIN_TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin1@footballbooking.com","password":"123456"}' \
  | jq -r '.data.token')

# 2. Thử tạo sân (nếu có quyền create_fields)
curl -X POST http://localhost:5000/api/fields \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test field",
    "fieldType": "5vs5",
    "location": "Test",
    "pricePerHour": 300000
  }'

# Có quyền: 201 Created
# Không có quyền: 403 Forbidden
```

---

## 📊 Database Example

**user_roles table:**
```
id | name          | display_name      | is_active
---|---------------|-------------------|----------
1  | fieldManager  | Quản lý sân       | true
2  | bookingMgr    | Quản lý booking   | true
3  | viewOnly      | Chỉ xem           | true
```

**role_permissions table:**
```
role_id | permission_id
--------|-------------
1       | 1  (view_fields)
1       | 2  (create_fields)
1       | 3  (edit_fields)
2       | 5  (view_all_bookings)
2       | 9  (update_booking_status)
```

**users table:**
```
id | email              | role  | custom_role_id
---|--------------------| ------|---------------
1  | superadmin@...     | superadmin | NULL
2  | admin1@...         | admin | 1 (fieldManager)
3  | admin2@...         | admin | 2 (bookingMgr)
4  | customer@...       | customer | NULL
```

---

## ✅ Checklist Setup

- [ ] Chạy `seed-permissions.js` → Tạo 17 permissions
- [ ] Chạy `seed.js` → Tạo users
- [ ] Login superadmin
- [ ] Tạo custom roles qua API
- [ ] Gán roles cho admins
- [ ] Test permissions

---

## 🎉 Tóm lại

**User Roles giúp:**
- ✅ Quản lý đơn giản hơn
- ✅ Scalable (dễ mở rộng)
- ✅ Cập nhật quyền nhanh chóng
- ✅ Tránh lỗi khi gán permissions
- ✅ Template cho các vai trò cố định

Made with 🎭 for better role management!
