# 🚀 Khởi động nhanh với Docker (5 phút)

## Bước 1: Cài Docker (nếu chưa có)

### Ubuntu/Debian:
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker
```

### macOS/Windows:
Tải Docker Desktop: https://www.docker.com/products/docker-desktop

## Bước 2: Khởi động ứng dụng

```bash
# Chạy tất cả (Backend + MySQL + phpMyAdmin)
docker compose up -d
```

Chờ ~30 giây để MySQL khởi động hoàn toàn.

## Bước 3: Seed dữ liệu mẫu

```bash
docker compose exec backend node seed.js
```

## ✅ Hoàn thành!

**Truy cập:**
- 🌐 Backend API: http://localhost:5000
- 🔧 phpMyAdmin: http://localhost:8080
  - Server: `mysql`
  - Username: `root`
  - Password: `rootpassword`

**Tài khoản test:**
- Admin: `admin@footballbooking.com` / `admin123`
- User: `nguyenvana@example.com` / `123456`

## 🧪 Test API

```bash
# Health check
curl http://localhost:5000/api/health

# Xem danh sách sân
curl http://localhost:5000/api/fields

# Đăng nhập
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@footballbooking.com","password":"admin123"}'
```

## 📝 Các lệnh hữu ích

```bash
# Xem logs
docker compose logs -f

# Dừng containers
docker compose down

# Restart
docker compose restart

# Xem containers đang chạy
docker compose ps
```

## 🔥 Development Mode (Hot Reload)

```bash
# Chạy với auto-reload khi code thay đổi
docker compose -f docker-compose.dev.yml up -d

# Xem logs real-time
docker compose -f docker-compose.dev.yml logs -f backend
```

## 🎯 Sử dụng Makefile (Dễ hơn)

```bash
make up      # Khởi động
make seed    # Seed dữ liệu
make logs    # Xem logs
make down    # Dừng containers
make dev     # Development mode
make help    # Xem tất cả lệnh
```

## ❓ Gặp vấn đề?

### Port đã được sử dụng?
Sửa file `docker-compose.yml`:
```yaml
ports:
  - "5001:5000"  # Đổi 5000 thành port khác
```

### Reset toàn bộ?
```bash
docker compose down -v  # Xóa cả database
docker compose up -d    # Chạy lại
docker compose exec backend node seed.js  # Seed lại
```

### Xem logs chi tiết?
```bash
docker compose logs -f backend  # Backend logs
docker compose logs -f mysql    # MySQL logs
```

## 📚 Tài liệu đầy đủ

- [DOCKER_GUIDE.md](DOCKER_GUIDE.md) - Hướng dẫn Docker chi tiết
- [README.md](README.md) - API Documentation đầy đủ
- [SETUP_GUIDE.md](SETUP_GUIDE.md) - Hướng dẫn setup tổng quan

---

**That's it! Bạn đã sẵn sàng develop! 🎉**
