const { sequelize } = require('./config/database');
require('dotenv').config();

// Import all models to ensure they're loaded
const User = require('./models/User');
const Field = require('./models/Field');
const Booking = require('./models/Booking');
const Permission = require('./models/Permission');
const UserPermission = require('./models/UserPermission');

const defaultPermissions = [
  // Fields permissions
  {
    name: 'view_fields',
    displayName: 'Xem danh sách sân',
    description: 'Xem tất cả sân bóng trong hệ thống',
    category: 'fields'
  },
  {
    name: 'create_fields',
    displayName: 'Tạo sân mới',
    description: 'Thêm sân bóng mới vào hệ thống',
    category: 'fields'
  },
  {
    name: 'edit_fields',
    displayName: 'Chỉnh sửa sân',
    description: 'Cập nhật thông tin sân bóng',
    category: 'fields'
  },
  {
    name: 'delete_fields',
    displayName: 'Xóa sân',
    description: 'Xóa sân bóng khỏi hệ thống',
    category: 'fields'
  },
  
  // Bookings permissions
  {
    name: 'view_all_bookings',
    displayName: 'Xem tất cả booking',
    description: 'Xem tất cả đơn đặt sân của mọi người',
    category: 'bookings'
  },
  {
    name: 'create_bookings',
    displayName: 'Tạo booking',
    description: 'Tạo đơn đặt sân cho khách hàng',
    category: 'bookings'
  },
  {
    name: 'edit_bookings',
    displayName: 'Chỉnh sửa booking',
    description: 'Cập nhật thông tin đơn đặt sân',
    category: 'bookings'
  },
  {
    name: 'cancel_bookings',
    displayName: 'Hủy booking',
    description: 'Hủy đơn đặt sân của khách hàng',
    category: 'bookings'
  },
  {
    name: 'update_booking_status',
    displayName: 'Cập nhật trạng thái booking',
    description: 'Thay đổi trạng thái đơn đặt (pending, confirmed, completed, cancelled)',
    category: 'bookings'
  },
  {
    name: 'update_payment_status',
    displayName: 'Cập nhật trạng thái thanh toán',
    description: 'Thay đổi trạng thái thanh toán (unpaid, paid, refunded)',
    category: 'bookings'
  },
  
  // Users permissions
  {
    name: 'view_customers',
    displayName: 'Xem danh sách khách hàng',
    description: 'Xem thông tin khách hàng',
    category: 'users'
  },
  {
    name: 'edit_customers',
    displayName: 'Chỉnh sửa khách hàng',
    description: 'Cập nhật thông tin khách hàng',
    category: 'users'
  },
  {
    name: 'delete_customers',
    displayName: 'Xóa khách hàng',
    description: 'Xóa tài khoản khách hàng',
    category: 'users'
  },
  {
    name: 'activate_deactivate_users',
    displayName: 'Kích hoạt/Vô hiệu hóa user',
    description: 'Bật/tắt trạng thái active của user',
    category: 'users'
  },
  
  // Stats permissions
  {
    name: 'view_stats',
    displayName: 'Xem thống kê',
    description: 'Xem báo cáo và thống kê hệ thống',
    category: 'stats'
  },
  {
    name: 'view_revenue',
    displayName: 'Xem doanh thu',
    description: 'Xem thống kê doanh thu',
    category: 'stats'
  },
  
  // Settings permissions
  {
    name: 'manage_settings',
    displayName: 'Quản lý cài đặt',
    description: 'Thay đổi cài đặt hệ thống',
    category: 'settings'
  }
];

const seedPermissions = async () => {
  try {
    console.log('🔑 Starting permissions seeding...');

    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Sync Permission model
    await Permission.sync({ alter: true });
    console.log('✅ Permission model synced');

    // Check if permissions already exist
    const existingCount = await Permission.count();
    
    if (existingCount > 0) {
      console.log(`⚠️  Found ${existingCount} existing permissions`);
      console.log('💡 Updating permissions...');
      
      // Update or create each permission
      for (const perm of defaultPermissions) {
        await Permission.upsert(perm);
      }
    } else {
      // Create all permissions
      await Permission.bulkCreate(defaultPermissions);
    }

    // Get final count
    const finalCount = await Permission.count();
    console.log(`✅ ${finalCount} permissions in database`);

    // Display permissions by category
    const permissions = await Permission.findAll({
      order: [['category', 'ASC'], ['name', 'ASC']]
    });

    console.log('\n📋 Available Permissions:\n');
    
    const byCategory = permissions.reduce((acc, perm) => {
      if (!acc[perm.category]) {
        acc[perm.category] = [];
      }
      acc[perm.category].push(perm);
      return acc;
    }, {});

    Object.entries(byCategory).forEach(([category, perms]) => {
      console.log(`\n🔹 ${category.toUpperCase()}:`);
      perms.forEach(p => {
        console.log(`   - ${p.name.padEnd(30)} → ${p.displayName}`);
      });
    });

    console.log('\n🎉 Permissions seeding completed!\n');
    console.log('💡 Next steps:');
    console.log('   1. Run: node seed.js (to create users)');
    console.log('   2. Login as superadmin');
    console.log('   3. Grant permissions to admin users via API\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedPermissions();
