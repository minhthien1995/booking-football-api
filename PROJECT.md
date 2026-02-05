# Football Field Booking API

API backend cho hệ thống đặt sân bóng đá. Xây dựng bằng Express.js, Sequelize ORM (MySQL), Socket.IO cho real-time, và JWT cho authentication.

---

## Công nghệ sử dụng

| Loại | Thành phần |
|---|---|
| Runtime | Node.js |
| Framework | Express.js 4.18 |
| ORM | Sequelize 6.35 + MySQL2 3.6 |
| Auth | jsonwebtoken 9.0 + bcryptjs 2.4 |
| Real-time | Socket.IO 4.8 |
| Validation | express-validator 7.0 |
| Utility | moment, dotenv, cors |
| Dev | nodemon |

---

## Cấu trúc thư mục

```
booking-football-api/
├── server.js                      # Entry point: Express app, Socket.IO, routes mounting
├── config/
│   └── database.js                # Sequelize connection config (MySQL, pool, timezone +07:00)
├── models/
│   ├── index.js                   # Model associations (relationships)
│   ├── User.js                    # users table
│   ├── Field.js                   # fields table (sân bóng)
│   ├── Booking.js                 # bookings table
│   ├── Notification.js            # notifications table
│   ├── Permission.js              # permissions table
│   ├── UserPermission.js          # user_permissions (junction: user <-> permission)
│   ├── UserRole.js                # user_roles (custom roles)
│   └── RolePermission.js          # role_permissions (junction: role <-> permission)
├── middleware/
│   ├── auth.js                    # protect (JWT verify), authorize (role check)
│   ├── permission.js              # checkPermission, checkAnyPermission, attachUserPermissions
│   └── validation.js              # express-validator rules: register, login, field, booking
├── controllers/
│   ├── authController.js          # Register, login, getMe, updateProfile, changePassword
│   ├── fieldController.js         # CRUD sân bóng
│   ├── bookingController.js       # CRUD đặt sân + status/payment updates + available slots
│   ├── adminController.js         # Quản lý users + dashboard stats
│   ├── superadminController.js    # Quản lý admins, customers, system stats
│   ├── permissionController.js    # Grant/revoke permissions cho admins
│   ├── roleController.js          # CRUD custom roles + assign/unassign/clone
│   ├── publicController.js        # Public booking flow (không cần auth) + Socket.IO emit
│   ├── notificationsController.js # Đọc/xóa notifications của user
│   └── reportsController.js       # Analytics: overview, revenue, field performance, customers, time slots
├── services/
│   └── notificationService.js     # NotificationService class: create, read, mark read, soft delete, cleanup
├── routes/
│   ├── authRoutes.js              # /api/auth/*
│   ├── fieldRoutes.js             # /api/fields/*
│   ├── bookingRoutes.js           # /api/bookings/*
│   ├── adminRoutes.js             # /api/admin/*
│   ├── superadminRoutes.js        # /api/superadmin/*
│   ├── permissionRoutes.js        # /api/permissions/*
│   ├── roleRoutes.js              # /api/roles/*
│   ├── publicRoutes.js            # /api/public/*
│   ├── reportsRoutes.js           # /api/reports/*
│   └── notificationsRoutes.js     # /api/notifications/*
├── seed.js                        # Seed data cho fields và users
├── seed-permissions.js            # Seed permissions table
├── init.sql                       # DB init script (grant privileges)
├── postman_collection.json        # Postman collection cho test API
├── .env.example                   # Template environment variables
└── package.json
```

---

## Database Models & Relationships

### 1. User (`users`)
| Field | Type | Notes |
|---|---|---|
| id | INT PK AI | |
| full_name | VARCHAR(100) | required |
| email | VARCHAR(100) UNIQUE | nullable (phone-only customers) |
| password | VARCHAR(255) | hashed bcrypt salt=12, nullable |
| phone | VARCHAR(15) | required |
| role | ENUM | `superadmin` / `admin` / `customer` |
| custom_role_id | INT FK | -> user_roles.id (chỉ cho admin) |
| is_active | BOOLEAN | default true |
| created_at / updated_at | DATETIME | auto |

- Hook `beforeCreate`/`beforeUpdate`: tự hash password.
- `toJSON()`: loại bỏ password khỏi response.
- `comparePassword()`: compare bcrypt.

### 2. Field (`fields`) — Sân bóng đá
| Field | Type | Notes |
|---|---|---|
| id | INT PK AI | |
| name | VARCHAR(100) | |
| field_type | ENUM | `5vs5` / `7vs7` / `11vs11` |
| location | VARCHAR(255) | |
| price_per_hour | DECIMAL(10,2) | |
| description | TEXT | nullable |
| image | VARCHAR(255) | URL, nullable |
| is_active | BOOLEAN | default true |
| open_time | TIME | default 06:00 |
| close_time | TIME | default 23:00 |

### 3. Booking (`bookings`) — Đặt sân
| Field | Type | Notes |
|---|---|---|
| id | INT PK AI | |
| user_id | INT FK | -> users.id |
| field_id | INT FK | -> fields.id |
| booking_date | DATE | |
| start_time | TIME | |
| end_time | TIME | |
| duration | INT | số giờ (1-12) |
| total_price | DECIMAL(10,2) | = duration * price_per_hour |
| status | ENUM | `pending` / `confirmed` / `completed` / `cancelled` |
| payment_status | ENUM | `unpaid` / `paid` / `refunded` |
| payment_method | ENUM | `cash` / `bank_transfer` / `momo` / `vnpay`, nullable |
| notes | TEXT | nullable |
| booking_code | VARCHAR(20) UNIQUE | auto-gen: `BK-YYYYMMDD-XXXX` |

- Unique index: `(field_id, booking_date, start_time, end_time)`.
- Hook `beforeValidate`: tự tạo booking_code.

### 4. Permission (`permissions`)
| Field | Type | Notes |
|---|---|---|
| id | INT PK AI | |
| name | VARCHAR(50) UNIQUE | e.g. `view_fields`, `create_bookings` |
| display_name | VARCHAR(100) | |
| description | VARCHAR(255) | |
| category | ENUM | `fields` / `bookings` / `users` / `stats` / `settings` |
| is_active | BOOLEAN | |

### 5. UserPermission (`user_permissions`) — Direct permission
| Field | Type | Notes |
|---|---|---|
| user_id | INT FK | -> users.id |
| permission_id | INT FK | -> permissions.id |
| granted_by | INT FK | -> users.id (superadmin) |
| granted_at | DATETIME | |

- Unique index: `(user_id, permission_id)`.

### 6. UserRole (`user_roles`) — Custom role
| Field | Type | Notes |
|---|---|---|
| id | INT PK AI | |
| name | VARCHAR(50) UNIQUE | |
| display_name | VARCHAR(100) | |
| description | VARCHAR(255) | |
| is_active | BOOLEAN | |
| created_by | INT FK | -> users.id |

### 7. RolePermission (`role_permissions`) — Role-Permission junction
| Field | Type | Notes |
|---|---|---|
| role_id | INT FK | -> user_roles.id |
| permission_id | INT FK | -> permissions.id |

- Unique index: `(role_id, permission_id)`.

### 8. Notification (`notifications`)
| Field | Type | Notes |
|---|---|---|
| id | INT PK AI | |
| userId | INT FK | -> users.id |
| type | ENUM | `new_booking` / `booking_updated` / `booking_cancelled` / `payment_received` / `system` |
| title | VARCHAR(255) | |
| message | TEXT | |
| data | JSON | metadata (bookingId, customerName, ...) |
| isRead | BOOLEAN | default false |
| readAt | DATETIME | |
| priority | ENUM | `low` / `medium` / `high` / `urgent` |
| isDeleted | BOOLEAN | soft delete |
| deletedAt | DATETIME | |

### Relationships Summary
```
User 1 ---< N Booking
Field 1 ---< N Booking
User >---< Permission    (through user_permissions — direct assignment)
UserRole >---< Permission (through role_permissions)
User N >--- 1 UserRole   (via custom_role_id)
User 1 ---< N Notification
```

---

## Authentication & Authorization

### JWT Flow
1. Client gửi `POST /api/auth/login` với email + password.
2. Server verify password bằng bcrypt, trả về JWT token (expire: 7 ngày theo `JWT_EXPIRE`).
3. Client đính kèm `Authorization: Bearer <token>` vào mọi request protected.

### Middleware
- **`protect`** (`middleware/auth.js`): Extract + verify JWT, attach `req.user`.
- **`authorize(...roles)`**: Kiểm tra `req.user.role` có trong danh sách cho phép.
- **`checkPermission(...permNames)`** (`middleware/permission.js`): Kiểm tra permission theo thứ tự:
  1. Superadmin -> pass (bypass mọi check).
  2. Customer -> reject.
  3. Admin -> check custom role permissions (RolePermission) -> nếu không có, check direct permissions (UserPermission).

### Permission Categories & Names
| Category | Permissions |
|---|---|
| fields | `view_fields`, `create_fields`, `edit_fields`, `delete_fields` |
| bookings | `view_bookings`, `create_bookings`, `edit_bookings`, `cancel_bookings` |
| users | `view_users`, `create_users`, `edit_users`, `delete_users` |
| stats | `view_stats` |
| settings | `manage_settings` |

---

## API Endpoints

### Auth — `/api/auth`
| Method | Path | Access | Controller |
|---|---|---|---|
| POST | `/register` | Public | `register` — tạo user (role=customer) |
| POST | `/login` | Public | `login` — trả JWT token |
| GET | `/me` | Protected | `getMe` — info user hiện tại |
| PUT | `/profile` | Protected | `updateProfile` — đổi fullName, phone |
| PUT | `/change-password` | Protected | `changePassword` — đổi mật khẩu |

### Fields — `/api/fields`
| Method | Path | Access | Controller |
|---|---|---|---|
| GET | `/` | Public | `getAllFields` — filter: fieldType, isActive, search |
| GET | `/:id` | Public | `getField` |
| POST | `/` | Admin+Permission(`create_fields`) | `createField` |
| PUT | `/:id` | Admin+Permission(`edit_fields`) | `updateField` |
| DELETE | `/:id` | Admin+Permission(`delete_fields`) | `deleteField` |

### Bookings — `/api/bookings`
| Method | Path | Access | Controller |
|---|---|---|---|
| POST | `/` | Protected | `createBooking` — conflict check, auto price calc |
| GET | `/` | Protected | `getAllBookings` — customers chỉ thấy bookings của mình |
| GET | `/:id` | Protected | `getBooking` |
| PUT | `/:id` | Protected | `updateBooking` — re-check conflicts nếu đổi giờ |
| PUT | `/:id/cancel` | Protected | `cancelBooking` |
| PUT | `/:id/status` | Admin/Superadmin | `updateBookingStatus` |
| PUT | `/:id/payment-status` | Admin/Superadmin | `updatePaymentStatus` |
| PUT | `/:id/quick-update` | Admin/Superadmin | `quickUpdateBooking` — update status + payment cùng lúc |
| GET | `/available-slots/:fieldId/:date` | Public | `getAvailableSlots` — 1h slots trong giờ hoạt động |

### Admin — `/api/admin`
| Method | Path | Access | Controller |
|---|---|---|---|
| GET | `/users` | Admin/Superadmin | `getAllUsers` — filter: role, isActive, search |
| GET | `/users/:id` | Admin/Superadmin | `getUser` — include bookings |
| PUT | `/users/:id` | Admin/Superadmin | `updateUser` |
| DELETE | `/users/:id` | Admin/Superadmin | `deleteUser` — ko xóa chính mình |
| GET | `/stats` | Admin/Superadmin | `getStats` — dashboard overview |

### Superadmin — `/api/superadmin`
| Method | Path | Access | Controller |
|---|---|---|---|
| GET | `/admins` | Superadmin | `getAllAdmins` |
| POST | `/admins` | Superadmin | `createAdmin` — có thể gán customRoleId |
| PUT | `/admins/:id` | Superadmin | `updateAdmin` |
| DELETE | `/admins/:id` | Superadmin | `deleteAdmin` |
| GET | `/customers` | Superadmin | `getAllCustomers` |
| POST | `/customers` | Superadmin/Admin | `createCustomer` — tạo với random password |
| POST | `/customers/find-or-create` | Superadmin/Admin | `findOrCreateCustomer` — lookup by phone |
| GET | `/stats` | Superadmin | `getSystemStats` — users by role breakdown |

### Permissions — `/api/permissions`
| Method | Path | Access | Controller |
|---|---|---|---|
| GET | `/` | Superadmin | `getAllPermissions` — grouped by category |
| GET | `/user/:userId` | Superadmin | `getUserPermissions` |
| POST | `/grant` | Superadmin | `grantPermission` — grant 1 permission |
| POST | `/grant-multiple` | Superadmin | `grantMultiplePermissions` — skip existing |
| DELETE | `/revoke` | Superadmin | `revokePermission` |
| DELETE | `/revoke-all/:userId` | Superadmin | `revokeAllPermissions` |
| POST | `/sync/:userId` | Superadmin | `syncUserPermissions` — replace all permissions |

### Roles — `/api/roles`
| Method | Path | Access | Controller |
|---|---|---|---|
| GET | `/` | Superadmin | `getAllRoles` — include permissions + users |
| GET | `/:id` | Superadmin | `getRole` |
| POST | `/` | Superadmin | `createRole` — kèm permissionIds |
| PUT | `/:id` | Superadmin | `updateRole` — replace permissions nếu truyền permissionIds |
| DELETE | `/:id` | Superadmin | `deleteRole` — block nếu có users đang dùng |
| POST | `/assign` | Superadmin | `assignRoleToUser` — set customRoleId |
| POST | `/unassign` | Superadmin | `unassignRoleFromUser` |
| POST | `/:id/clone` | Superadmin | `cloneRole` — copy role + permissions |

### Public — `/api/public` (không cần authentication)
| Method | Path | Controller |
|---|---|---|
| GET | `/fields` | `getPublicFields` — chỉ active fields |
| GET | `/fields/:id` | `getPublicField` |
| GET | `/fields/:fieldId/slots/:date` | `getAvailableSlots` — slots 06:00-22:00 |
| GET | `/fields/search-available` | `findAvailableFields` — search by date+time, returns available + unavailable |
| POST | `/customers/find-or-create` | `findOrCreateCustomer` — phone-based (10 số bắt đầu 0) |
| POST | `/bookings` | `createPublicBooking` — tạo booking + notification + Socket.IO emit |

### Reports — `/api/reports`
| Method | Path | Access | Controller |
|---|---|---|---|
| GET | `/overview` | Admin/Superadmin | `getOverviewReport` — total bookings, revenue, new customers |
| GET | `/revenue-by-date` | Admin/Superadmin | `getRevenueByDate` — revenue per day |
| GET | `/field-performance` | Admin/Superadmin | `getFieldPerformance` — bookings + revenue per field |
| GET | `/customers` | Admin/Superadmin | `getCustomerReport` — top customers by spend |
| GET | `/time-slots` | Admin/Superadmin | `getTimeSlotAnalysis` — hourly booking distribution |

> Tất cả reports hỗ trợ `period` query param: `today`, `yesterday`, `this_week`, `last_week`, `this_month`, `last_month`, `this_year`, `custom` (kèm `startDate` + `endDate`).

### Notifications — `/api/notifications`
| Method | Path | Access | Controller |
|---|---|---|---|
| GET | `/` | Admin/Superadmin | `getNotifications` — pagination, filter by unreadOnly/type |
| GET | `/unread-count` | Admin/Superadmin | `getUnreadCount` |
| PUT | `/:id/read` | Admin/Superadmin | `markAsRead` |
| PUT | `/read-all` | Admin/Superadmin | `markAllAsRead` |
| DELETE | `/:id` | Admin/Superadmin | `deleteNotification` (soft delete) |
| DELETE | `/` | Admin/Superadmin | `deleteAll` (soft delete all) |

### Health Check
| Method | Path | Notes |
|---|---|---|
| GET | `/api/health` | Returns server status + Socket.IO state |

---

## Business Logic Quan Trọng

### 1. Conflict Detection (Booking)
Khi tạo hoặc update booking, system check 4 overlap cases:
- Booking mới bắt đầu trong lúc booking hiện tại đang diễn ra.
- Booking mới kết thúc trong lúc booking hiện tại đang diễn ra.
- Booking mới bao gồm hoàn toàn booking hiện tại.
- Exact same time slot.

Chỉ check với bookings có `status != cancelled`.

### 2. Auto Booking Code
Format: `BK-YYYYMMDD-XXXX` (X là random alphanumeric uppercase). Tạo tự động trong hook `beforeValidate` của model Booking.

### 3. Price Calculation
`totalPrice = duration (giờ) * field.pricePerHour`. Tính lại tự động nếu duration thay đổi khi update booking.

### 4. Booking Status Flow
```
pending -> confirmed -> completed
                     \-> cancelled
pending -> cancelled
confirmed -> cancelled
```
Booking đã `completed` hoặc `cancelled` không thể update.

### 5. Payment Status Flow
```
unpaid -> paid -> refunded
```
Chỉ được `refunded` nếu đã `paid`.

### 6. Public Booking Flow
1. Frontend gọi `POST /api/public/customers/find-or-create` với phone + fullName.
2. Nếu customer chưa có -> tạo mới (không cần email/password).
3. Frontend gọi `POST /api/public/bookings` với userId từ bước 1.
4. Server tạo booking, sau đó:
   - Tạo notification trong DB cho toàn bộ admins/superadmins (`NotificationService.createForAdmins`).
   - Emit Socket.IO event `new-booking` broadcast cho tất cả clients.

### 7. Available Slots
Tính 1-giờ slots từ `open_time` đến `close_time` của sân. Mỗi slot đánh dấu `available: true/false` dựa trên bookings hiện tại (trừ cancelled).

---

## Real-time (Socket.IO)

- Setup ở `server.js`, CORS allow: `localhost:3000`, `localhost:3001`, GitHub Pages URL.
- `io` object được attach vào app via `app.set('socketio', io)` để controllers truy cập.
- Event emitted: **`new-booking`** — broadcast khi có booking mới qua public flow.
- Payload: `bookingId`, `customerName`, `customerPhone`, `fieldName`, `bookingDate`, `startTime`, `endTime`, `totalPrice`, `createdAt`, `message`.

---

## NotificationService

Class static methods trong `services/notificationService.js`:

| Method | Mô tả |
|---|---|
| `createForAdmins(data)` | Tạo notification cho tất cả active admins/superadmins |
| `createForUser(userId, data)` | Tạo notification cho 1 user cụ thể |
| `getForUser(userId, options)` | Lấy notifications (pagination, filter unread/type) |
| `getUnreadCount(userId)` | Đếm unread notifications |
| `markAsRead(notificationId, userId)` | Mark 1 notification đã đọc |
| `markAllAsRead(userId)` | Mark tất cả đã đọc |
| `softDelete(notificationId, userId)` | Soft delete (set isDeleted=true) |
| `deleteAllForUser(userId)` | Soft delete tất cả |
| `cleanup(daysOld=30)` | Hard delete notifications đã soft-deleted quá 30 ngày |

---

## Environment Variables (`.env`)

```env
PORT=5000                          # Server port
NODE_ENV=development               # development / production

DB_HOST=localhost                   # MySQL host
DB_USER=root                       # MySQL user
DB_PASSWORD=your_password          # MySQL password
DB_NAME=football_booking           # Database name
DB_PORT=3306                       # MySQL port

JWT_SECRET=your_secret_key         # JWT signing secret
JWT_EXPIRE=7d                      # Token expiration

SUPERADMIN_EMAIL=superadmin@...    # First superadmin email (seed)
SUPERADMIN_PASSWORD=superadmin123  # First superadmin password (seed)
```

---

## Cách chạy

```bash
# Install dependencies
npm install

# Copy and configure .env
cp .env.example .env

# Seed database (chỉ lần đầu)
node seed.js
node seed-permissions.js

# Run development (auto-reload)
npm run dev

# Run production
npm start
```

> **Lưu ý:** `sequelize.sync()` đã commented out. Tables phải được tạo thủ công hoặc qua seed scripts.
