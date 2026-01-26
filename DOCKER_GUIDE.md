# 🐳 HƯỚNG DẪN CHẠY VỚI DOCKER

## 📋 Yêu cầu

- Docker: v20.10 trở lên
- Docker Compose: v2.0 trở lên

## 🚀 Cài đặt Docker

### Ubuntu/Debian:
```bash
# Update package index
sudo apt update

# Install prerequisites
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add user to docker group (to run without sudo)
sudo usermod -aG docker $USER

# Log out and log back in for group changes to take effect
# Or run: newgrp docker

# Verify installation
docker --version
docker compose version
```

### macOS:
```bash
# Download Docker Desktop from:
# https://www.docker.com/products/docker-desktop

# Or use Homebrew:
brew install --cask docker
```

### Windows:
```
Download Docker Desktop from:
https://www.docker.com/products/docker-desktop
```

## 🎯 Chạy ứng dụng với Docker

### Option 1: Production Mode (Khuyến nghị để demo/test)

```bash
# Build và chạy tất cả containers
docker compose up -d

# Xem logs
docker compose logs -f

# Xem logs của một service cụ thể
docker compose logs -f backend
docker compose logs -f mysql
```

**Kết quả:**
- ✅ Backend API: http://localhost:5000
- ✅ phpMyAdmin: http://localhost:8080
- ✅ MySQL: localhost:3307

### Option 2: Development Mode (Hot reload)

```bash
# Chạy với file docker-compose.dev.yml
docker compose -f docker-compose.dev.yml up -d

# Xem logs
docker compose -f docker-compose.dev.yml logs -f
```

**Ưu điểm Development Mode:**
- 🔥 Hot reload: Code thay đổi tự động restart
- 📝 Logs chi tiết hơn
- 🐛 Dễ debug

## 📊 Seed dữ liệu mẫu

Sau khi containers chạy, seed dữ liệu:

```bash
# Chạy seed script trong container
docker compose exec backend node seed.js

# Hoặc với dev mode:
docker compose -f docker-compose.dev.yml exec backend node seed.js
```

**Dữ liệu được tạo:**
- 1 admin: admin@footballbooking.com / admin123
- 3 users thường
- 6 sân bóng
- 5 bookings mẫu

## 🧪 Kiểm tra ứng dụng

### 1. Health Check
```bash
curl http://localhost:5000/api/health
```

### 2. Đăng nhập Admin
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@footballbooking.com",
    "password": "admin123"
  }'
```

### 3. Xem danh sách sân
```bash
curl http://localhost:5000/api/fields
```

### 4. Truy cập phpMyAdmin
Mở trình duyệt: http://localhost:8080
- Server: mysql
- Username: root
- Password: rootpassword

## 🛠️ Các lệnh Docker hữu ích

### Quản lý Containers

```bash
# Xem containers đang chạy
docker compose ps

# Dừng containers
docker compose down

# Dừng và xóa volumes (XÓA DATABASE!)
docker compose down -v

# Restart một service
docker compose restart backend

# Rebuild containers (sau khi sửa code)
docker compose up -d --build

# Xem resource usage
docker stats
```

### Truy cập vào Container

```bash
# Vào bash của backend container
docker compose exec backend sh

# Vào MySQL CLI
docker compose exec mysql mysql -u root -prootpassword football_booking

# Chạy lệnh trong container
docker compose exec backend npm run dev
```

### Xem Logs

```bash
# Logs tất cả services
docker compose logs

# Logs với tail (50 dòng cuối)
docker compose logs --tail=50

# Logs real-time
docker compose logs -f

# Logs của một service
docker compose logs backend
docker compose logs mysql
```

## 🔧 Troubleshooting

### 1. Port đã được sử dụng

**Lỗi:** "Port 5000 is already in use"

**Giải pháp:** Sửa file `docker-compose.yml`
```yaml
services:
  backend:
    ports:
      - "5001:5000"  # Đổi 5000 thành 5001
```

### 2. MySQL không kết nối được

```bash
# Kiểm tra MySQL health
docker compose exec mysql mysqladmin ping -h localhost -u root -prootpassword

# Xem logs MySQL
docker compose logs mysql

# Restart MySQL
docker compose restart mysql
```

### 3. Backend không kết nối được MySQL

```bash
# Kiểm tra network
docker compose exec backend ping mysql

# Xem environment variables
docker compose exec backend printenv

# Restart backend sau khi MySQL đã ready
docker compose restart backend
```

### 4. Database bị lỗi hoặc cần reset

```bash
# Dừng và xóa tất cả (bao gồm database)
docker compose down -v

# Chạy lại từ đầu
docker compose up -d

# Seed lại dữ liệu
docker compose exec backend node seed.js
```

### 5. Code thay đổi nhưng không update (Production mode)

```bash
# Rebuild image
docker compose up -d --build
```

### 6. Xem chi tiết lỗi

```bash
# Xem logs chi tiết
docker compose logs -f backend

# Vào container để debug
docker compose exec backend sh
npm run dev  # chạy trực tiếp để xem lỗi
```

## 🔄 Workflow Development

### Làm việc thường ngày:

```bash
# 1. Bật containers (lần đầu)
docker compose -f docker-compose.dev.yml up -d

# 2. Xem logs khi code
docker compose -f docker-compose.dev.yml logs -f backend

# 3. Code như bình thường, app sẽ tự reload

# 4. Khi xong việc, tắt containers (giữ data)
docker compose -f docker-compose.dev.yml stop

# 5. Ngày hôm sau, bật lại
docker compose -f docker-compose.dev.yml start
```

### Reset hoàn toàn:

```bash
# Xóa tất cả (containers, networks, volumes)
docker compose down -v

# Build và chạy lại từ đầu
docker compose up -d --build

# Seed data
docker compose exec backend node seed.js
```

## 📦 Production Deployment

### Build for Production:

```bash
# Build image
docker build -t football-booking-backend:1.0 .

# Run production container
docker run -d \
  --name football-booking-api \
  -p 5000:5000 \
  --env-file .env.production \
  football-booking-backend:1.0
```

### Docker Hub (Optional):

```bash
# Tag image
docker tag football-booking-backend:1.0 yourusername/football-booking:1.0

# Push to Docker Hub
docker push yourusername/football-booking:1.0
```

## 🎯 So sánh các mode

| Feature | Production | Development |
|---------|-----------|-------------|
| **File** | docker-compose.yml | docker-compose.dev.yml |
| **Hot Reload** | ❌ | ✅ |
| **Volume Mount** | ❌ | ✅ |
| **Dependencies** | Production only | All (dev + prod) |
| **Logs** | Minimal | Detailed |
| **Best for** | Demo, Testing | Development |

## 🌟 Best Practices

1. **Development**: Luôn dùng `docker-compose.dev.yml`
2. **Testing**: Dùng `docker-compose.yml` để test production build
3. **Logs**: Thường xuyên check logs khi develop
4. **Clean Up**: Định kỳ dọn dẹp:
   ```bash
   docker system prune -a --volumes
   ```
5. **Environment**: Không commit file `.env` thật lên Git
6. **Backup**: Backup volume MySQL trước khi `docker compose down -v`

## 📊 Container Structure

```
┌─────────────────────────────────────────┐
│         football_network               │
│  ┌──────────┐  ┌──────────┐  ┌────────┐│
│  │ Backend  │  │  MySQL   │  │phpMyA. ││
│  │  :5000   │←→│  :3306   │←→│ :8080  ││
│  └──────────┘  └──────────┘  └────────┘│
│                     ↓                   │
│              ┌──────────────┐           │
│              │ mysql_data   │           │
│              │  (Volume)    │           │
│              └──────────────┘           │
└─────────────────────────────────────────┘
```

## ✅ Checklist

Sau khi setup Docker thành công:

- [ ] Docker và Docker Compose đã cài đặt
- [ ] `docker compose up -d` chạy thành công
- [ ] Backend accessible tại http://localhost:5000
- [ ] MySQL đang chạy
- [ ] phpMyAdmin accessible tại http://localhost:8080
- [ ] Đã seed dữ liệu mẫu
- [ ] Test API với Postman
- [ ] Đọc logs không có lỗi

## 🎉 Hoàn thành!

Bây giờ bạn có thể:
- ✅ Develop mà không cần cài MySQL local
- ✅ Test trong môi trường giống production
- ✅ Dễ dàng reset và seed lại data
- ✅ Quản lý database với phpMyAdmin
- ✅ Deploy dễ dàng với Docker

Chúc bạn code vui vẻ! 🚀
