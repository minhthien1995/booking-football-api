const { User, Booking, Field } = require('../models');
const { Op } = require('sequelize');

// @desc    Get all admin users (only superadmin can access)
// @route   GET /api/superadmin/admins
// @access  Private/Superadmin
exports.getAllAdmins = async (req, res) => {
  try {
    const { isActive, search } = req.query;

    const whereClause = {
      role: 'admin'
    };

    if (isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    }

    if (search) {
      whereClause[Op.or] = [
        { fullName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } }
      ];
    }

    const admins = await User.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: admins.length,
      data: admins
    });
  } catch (error) {
    console.error('Get all admins error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách quản lý'
    });
  }
};

// @desc    Create new admin user
// @route   POST /api/superadmin/admins
// @access  Private/Superadmin
exports.createAdmin = async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email đã được sử dụng'
      });
    }

    // Create admin user
    const admin = await User.create({
      fullName,
      email,
      password,
      phone,
      role: 'admin'
    });

    res.status(201).json({
      success: true,
      message: 'Tạo tài khoản quản lý thành công',
      data: admin
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo tài khoản quản lý'
    });
  }
};

// @desc    Update admin user
// @route   PUT /api/superadmin/admins/:id
// @access  Private/Superadmin
exports.updateAdmin = async (req, res) => {
  try {
    const admin = await User.findByPk(req.params.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy quản lý'
      });
    }

    // Ensure user is an admin
    if (admin.role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'User này không phải là quản lý'
      });
    }

    const { fullName, email, phone, isActive } = req.body;

    // Check if email is already taken by another user
    if (email && email !== admin.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email đã được sử dụng'
        });
      }
      admin.email = email;
    }

    if (fullName !== undefined) admin.fullName = fullName;
    if (phone !== undefined) admin.phone = phone;
    if (isActive !== undefined) admin.isActive = isActive;

    await admin.save();

    res.status(200).json({
      success: true,
      message: 'Cập nhật quản lý thành công',
      data: admin
    });
  } catch (error) {
    console.error('Update admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật quản lý'
    });
  }
};

// @desc    Delete admin user
// @route   DELETE /api/superadmin/admins/:id
// @access  Private/Superadmin
exports.deleteAdmin = async (req, res) => {
  try {
    const admin = await User.findByPk(req.params.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy quản lý'
      });
    }

    // Ensure user is an admin
    if (admin.role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'User này không phải là quản lý'
      });
    }

    await admin.destroy();

    res.status(200).json({
      success: true,
      message: 'Xóa quản lý thành công'
    });
  } catch (error) {
    console.error('Delete admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa quản lý'
    });
  }
};

// @desc    Get all customers
// @route   GET /api/superadmin/customers
// @access  Private/Superadmin
exports.getAllCustomers = async (req, res) => {
  try {
    const { isActive, search } = req.query;

    const whereClause = {
      role: 'customer'
    };

    if (isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    }

    if (search) {
      whereClause[Op.or] = [
        { fullName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } }
      ];
    }

    const customers = await User.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: customers.length,
      data: customers
    });
  } catch (error) {
    console.error('Get all customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách khách hàng'
    });
  }
};

// @desc    Create or get customer by phone (for booking flow)
// @route   POST /api/superadmin/customers/find-or-create
// @access  Private/Superadmin or Admin
exports.findOrCreateCustomer = async (req, res) => {
  try {
    const { phone, fullName } = req.body;

    // Validation
    if (!phone || !fullName) {
      return res.status(400).json({
        success: false,
        message: 'Số điện thoại và họ tên là bắt buộc'
      });
    }

    // Check if phone exists
    let customer = await User.findOne({ where: { phone, role: 'customer' } });

    if (customer) {
      // Customer exists, return customer
      return res.status(200).json({
        success: true,
        message: 'Khách hàng đã tồn tại',
        data: {
          customer: customer.toJSON(),
          isNewCustomer: false
        }
      });
    }

    // Customer doesn't exist, create new one
    // No email, no password for now - they can set it up later
    customer = await User.create({
      phone,
      fullName,
      email: null, // No email required
      password: null, // No password required for phone-only customers
      role: 'customer',
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: 'Tạo khách hàng mới thành công',
      data: {
        customer: customer.toJSON(),
        isNewCustomer: true
      }
    });
  } catch (error) {
    console.error('Find or create customer error:', error);
    
    // Handle unique constraint error
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Số điện thoại đã được sử dụng'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xử lý khách hàng',
      error: error.message
    });
  }
};

// @desc    Create new customer (Admin can create for booking)
// @route   POST /api/superadmin/customers
// @access  Private/Superadmin or Admin
exports.createCustomer = async (req, res) => {
  try {
    const { email, fullName, phone } = req.body;

    // Validation
    if (!email || !fullName || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Email, fullName và phone là bắt buộc'
      });
    }

    // Check if email exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email đã tồn tại'
      });
    }

    // Generate random password (8 characters)
    const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase();

    // Create customer
    const customer = await User.create({
      email,
      password: randomPassword, // Will be hashed by User model hook
      fullName,
      phone,
      role: 'customer',
      isActive: true
    });

    // Remove password from response
    const customerData = customer.toJSON();
    delete customerData.password;

    res.status(201).json({
      success: true,
      message: 'Tạo khách hàng thành công',
      data: {
        customer: customerData,
        temporaryPassword: randomPassword // Return to admin to notify customer
      }
    });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo khách hàng',
      error: error.message
    });
  }
};

// @desc    Get system statistics (for superadmin)
// @route   GET /api/superadmin/stats
// @access  Private/Superadmin
exports.getSystemStats = async (req, res) => {
  try {
    const totalSuperadmins = await User.count({ where: { role: 'superadmin' } });
    const totalAdmins = await User.count({ where: { role: 'admin' } });
    const totalCustomers = await User.count({ where: { role: 'customer' } });
    const totalFields = await Field.count();
    const totalBookings = await Booking.count();
    
    const pendingBookings = await Booking.count({ where: { status: 'pending' } });
    const confirmedBookings = await Booking.count({ where: { status: 'confirmed' } });
    const completedBookings = await Booking.count({ where: { status: 'completed' } });
    const cancelledBookings = await Booking.count({ where: { status: 'cancelled' } });

    const unpaidBookings = await Booking.count({ where: { paymentStatus: 'unpaid' } });
    const paidBookings = await Booking.count({ where: { paymentStatus: 'paid' } });

    // Calculate total revenue from paid bookings
    const paidBookingsData = await Booking.findAll({
      where: { paymentStatus: 'paid' },
      attributes: ['totalPrice']
    });

    const totalRevenue = paidBookingsData.reduce((sum, booking) => {
      return sum + parseFloat(booking.totalPrice);
    }, 0);

    res.status(200).json({
      success: true,
      data: {
        users: {
          superadmins: totalSuperadmins,
          admins: totalAdmins,
          customers: totalCustomers,
          total: totalSuperadmins + totalAdmins + totalCustomers
        },
        totalFields,
        totalBookings,
        bookingsByStatus: {
          pending: pendingBookings,
          confirmed: confirmedBookings,
          completed: completedBookings,
          cancelled: cancelledBookings
        },
        bookingsByPayment: {
          unpaid: unpaidBookings,
          paid: paidBookings
        },
        totalRevenue: totalRevenue.toFixed(2)
      }
    });
  } catch (error) {
    console.error('Get system stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê hệ thống'
    });
  }
};