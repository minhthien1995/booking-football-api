const { sequelize } = require('./config/database');
const { User, Field, Booking } = require('./models');
require('dotenv').config();

const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Sync all models (this will create tables if they don't exist)
    await sequelize.sync({ force: true }); // WARNING: This will drop all tables
    console.log('✅ Database synced');

    // Create superadmin user
    const superadmin = await User.create({
      fullName: 'Super Admin',
      email: process.env.SUPERADMIN_EMAIL || 'superadmin@footballbooking.com',
      password: process.env.SUPERADMIN_PASSWORD || 'superadmin123',
      phone: '0900000000',
      role: 'superadmin'
    });
    console.log('✅ Superadmin user created');

    // Create admin users (quản lý được phân quyền bởi superadmin)
    const admins = await User.bulkCreate([
      {
        fullName: 'Quản lý 1',
        email: 'admin1@footballbooking.com',
        password: '123456',
        phone: '0901111111',
        role: 'admin'
      },
      {
        fullName: 'Quản lý 2',
        email: 'admin2@footballbooking.com',
        password: '123456',
        phone: '0902222222',
        role: 'admin'
      }
    ]);
    console.log(`✅ ${admins.length} admin users created`);

    // Create customer users (khách hàng)
    const customers = await User.bulkCreate([
      {
        fullName: 'Nguyễn Văn A',
        email: 'nguyenvana@example.com',
        password: '123456',
        phone: '0903333333',
        role: 'customer'
      },
      {
        fullName: 'Trần Thị B',
        email: 'tranthib@example.com',
        password: '123456',
        phone: '0904444444',
        role: 'customer'
      },
      {
        fullName: 'Lê Văn C',
        email: 'levanc@example.com',
        password: '123456',
        phone: '0905555555',
        role: 'customer'
      },
      {
        fullName: 'Phạm Thị D',
        email: 'phamthid@example.com',
        password: '123456',
        phone: '0906666666',
        role: 'customer'
      }
    ]);
    console.log(`✅ ${customers.length} customer users created`);

    // Create sample fields
    const fields = await Field.bulkCreate([
      {
        name: 'Sân Mini 1',
        fieldType: '5vs5',
        location: '123 Nguyễn Văn Linh, Q.7, TP.HCM',
        pricePerHour: 300000,
        description: 'Sân cỏ nhân tạo 5 người, có mái che, đèn chiếu sáng',
        image: 'https://picsum.photos/400/300?random=1',
        openTime: '06:00:00',
        closeTime: '23:00:00',
        isActive: true
      },
      {
        name: 'Sân Mini 2',
        fieldType: '5vs5',
        location: '456 Lê Văn Việt, Q.9, TP.HCM',
        pricePerHour: 350000,
        description: 'Sân cỏ tự nhiên 5 người, không gian thoáng mát',
        image: 'https://picsum.photos/400/300?random=2',
        openTime: '06:00:00',
        closeTime: '23:00:00',
        isActive: true
      },
      {
        name: 'Sân 7 người A',
        fieldType: '7vs7',
        location: '789 Võ Văn Ngân, Thủ Đức, TP.HCM',
        pricePerHour: 500000,
        description: 'Sân cỏ nhân tạo 7 người, chất lượng cao',
        image: 'https://picsum.photos/400/300?random=3',
        openTime: '06:00:00',
        closeTime: '23:00:00',
        isActive: true
      },
      {
        name: 'Sân 7 người B',
        fieldType: '7vs7',
        location: '321 Phan Văn Trị, Bình Thạnh, TP.HCM',
        pricePerHour: 550000,
        description: 'Sân cỏ nhân tạo 7 người, có phòng thay đồ',
        image: 'https://picsum.photos/400/300?random=4',
        openTime: '06:00:00',
        closeTime: '23:00:00',
        isActive: true
      },
      {
        name: 'Sân 11 người',
        fieldType: '11vs11',
        location: '654 Quốc lộ 13, Thủ Đức, TP.HCM',
        pricePerHour: 1000000,
        description: 'Sân cỏ tự nhiên 11 người, tiêu chuẩn thi đấu',
        image: 'https://picsum.photos/400/300?random=5',
        openTime: '06:00:00',
        closeTime: '22:00:00',
        isActive: true
      },
      {
        name: 'Sân Mini 3',
        fieldType: '5vs5',
        location: '147 Điện Biên Phủ, Q.3, TP.HCM',
        pricePerHour: 400000,
        description: 'Sân cỏ nhân tạo 5 người, vị trí trung tâm',
        image: 'https://picsum.photos/400/300?random=6',
        openTime: '06:00:00',
        closeTime: '23:00:00',
        isActive: true
      }
    ]);
    console.log(`✅ ${fields.length} sample fields created`);

    // Create sample bookings
    const bookings = await Booking.bulkCreate([
      {
        userId: customers[0].id,
        fieldId: fields[0].id,
        bookingDate: '2024-01-27',
        startTime: '18:00:00',
        endTime: '20:00:00',
        duration: 2,
        totalPrice: 600000,
        status: 'confirmed',
        paymentStatus: 'paid',
        paymentMethod: 'momo',
        notes: 'Đặt sân cho đội ABC'
      },
      {
        userId: customers[1].id,
        fieldId: fields[1].id,
        bookingDate: '2024-01-28',
        startTime: '17:00:00',
        endTime: '18:00:00',
        duration: 1,
        totalPrice: 350000,
        status: 'pending',
        paymentStatus: 'unpaid',
        notes: 'Đặt sân tập luyện'
      },
      {
        userId: customers[2].id,
        fieldId: fields[2].id,
        bookingDate: '2024-01-29',
        startTime: '19:00:00',
        endTime: '21:00:00',
        duration: 2,
        totalPrice: 1000000,
        status: 'confirmed',
        paymentStatus: 'paid',
        paymentMethod: 'bank_transfer',
        notes: 'Thi đấu giao hữu'
      },
      {
        userId: customers[0].id,
        fieldId: fields[3].id,
        bookingDate: '2024-01-30',
        startTime: '20:00:00',
        endTime: '22:00:00',
        duration: 2,
        totalPrice: 1100000,
        status: 'completed',
        paymentStatus: 'paid',
        paymentMethod: 'cash',
        notes: 'Đã hoàn thành'
      },
      {
        userId: customers[1].id,
        fieldId: fields[0].id,
        bookingDate: '2024-01-26',
        startTime: '16:00:00',
        endTime: '17:00:00',
        duration: 1,
        totalPrice: 300000,
        status: 'cancelled',
        paymentStatus: 'refunded',
        notes: 'Hủy vì thời tiết xấu'
      }
    ]);
    console.log(`✅ ${bookings.length} sample bookings created`);

    console.log('\n🎉 Database seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   - Superadmin: ${superadmin.email} / ${process.env.SUPERADMIN_PASSWORD || 'superadmin123'}`);
    console.log(`   - Admins: ${admins.length} accounts`);
    console.log(`   - Customers: ${customers.length} accounts`);
    console.log(`   - Fields: ${fields.length} football fields`);
    console.log(`   - Bookings: ${bookings.length} sample bookings`);
    console.log('\n💡 You can now login with:');
    console.log(`   Superadmin: ${superadmin.email} / ${process.env.SUPERADMIN_PASSWORD || 'superadmin123'}`);
    console.log(`   Admin: admin1@footballbooking.com / 123456`);
    console.log(`   Customer: nguyenvana@example.com / 123456`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedData();
