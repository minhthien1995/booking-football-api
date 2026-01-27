const { Field, Booking, User } = require('../models');
const { Op } = require('sequelize');

// @desc    Get all active fields for public
// @route   GET /api/public/fields
// @access  Public
exports.getPublicFields = async (req, res) => {
  try {
    const { search, fieldType } = req.query;

    const whereClause = {
      isActive: true // Only show active fields
    };

    // Search filter
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { location: { [Op.like]: `%${search}%` } }
      ];
    }

    // Field type filter
    if (fieldType) {
      whereClause.fieldType = fieldType;
    }

    const fields = await Field.findAll({
      where: whereClause,
      attributes: ['id', 'name', 'fieldType', 'location', 'description', 'pricePerHour', 'isActive'],
      order: [['name', 'ASC']]
    });

    res.status(200).json({
      success: true,
      count: fields.length,
      data: fields
    });
  } catch (error) {
    console.error('Get public fields error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách sân'
    });
  }
};

// @desc    Get single field details for public
// @route   GET /api/public/fields/:id
// @access  Public
exports.getPublicField = async (req, res) => {
  try {
    const field = await Field.findOne({
      where: {
        id: req.params.id,
        isActive: true
      },
      attributes: ['id', 'name', 'fieldType', 'location', 'description', 'pricePerHour']
    });

    if (!field) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sân'
      });
    }

    res.status(200).json({
      success: true,
      data: field
    });
  } catch (error) {
    console.error('Get public field error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin sân'
    });
  }
};

// @desc    Get available time slots for a field
// @route   GET /api/public/fields/:fieldId/slots/:date
// @access  Public
exports.getAvailableSlots = async (req, res) => {
  try {
    const { fieldId, date } = req.params;

    // Check if field exists and is active
    const field = await Field.findOne({
      where: {
        id: fieldId,
        isActive: true
      }
    });

    if (!field) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sân'
      });
    }

    // Get all bookings for this field on this date
    const bookings = await Booking.findAll({
      where: {
        fieldId,
        bookingDate: date,
        status: { [Op.notIn]: ['cancelled'] }
      },
      attributes: ['startTime', 'endTime'],
      order: [['startTime', 'ASC']]
    });

    // Generate time slots (6:00 - 22:00, 1-hour intervals)
    const slots = [];
    for (let hour = 6; hour < 22; hour++) {
      const startTime = `${hour.toString().padStart(2, '0')}:00`;
      const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;

      // Check if this slot conflicts with any booking
      const isBooked = bookings.some(booking => {
        const bookingStart = booking.startTime.substring(0, 5);
        const bookingEnd = booking.endTime.substring(0, 5);
        
        return (
          (startTime >= bookingStart && startTime < bookingEnd) ||
          (endTime > bookingStart && endTime <= bookingEnd) ||
          (startTime <= bookingStart && endTime >= bookingEnd)
        );
      });

      slots.push({
        startTime,
        endTime,
        available: !isBooked
      });
    }

    res.status(200).json({
      success: true,
      data: {
        field: {
          id: field.id,
          name: field.name,
          pricePerHour: field.pricePerHour
        },
        date,
        slots
      }
    });
  } catch (error) {
    console.error('Get available slots error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy khung giờ'
    });
  }
};

// @desc    Find or create customer by phone
// @route   POST /api/public/customers/find-or-create
// @access  Public
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

    // Validate phone format
    const phoneRegex = /^0\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0)'
      });
    }

    // Check if customer exists
    let customer = await User.findOne({ 
      where: { phone, role: 'customer' } 
    });

    if (customer) {
      return res.status(200).json({
        success: true,
        message: 'Khách hàng đã tồn tại',
        data: {
          customer: {
            id: customer.id,
            fullName: customer.fullName,
            phone: customer.phone
          },
          isNewCustomer: false
        }
      });
    }

    // Create new customer
    customer = await User.create({
      phone,
      fullName,
      email: null,
      password: null,
      role: 'customer',
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: 'Tạo khách hàng mới thành công',
      data: {
        customer: {
          id: customer.id,
          fullName: customer.fullName,
          phone: customer.phone
        },
        isNewCustomer: true
      }
    });
  } catch (error) {
    console.error('Find or create customer error:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Số điện thoại đã được sử dụng'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

// @desc    Create public booking
// @route   POST /api/public/bookings
// @access  Public
exports.createPublicBooking = async (req, res) => {
  try {
    const { userId, fieldId, bookingDate, startTime, endTime, duration, totalPrice, notes } = req.body;

    // Validation
    if (!userId || !fieldId || !bookingDate || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc'
      });
    }

    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user || user.role !== 'customer') {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khách hàng'
      });
    }

    // Check if field exists and is active
    const field = await Field.findOne({
      where: {
        id: fieldId,
        isActive: true
      }
    });

    if (!field) {
      return res.status(404).json({
        success: false,
        message: 'Sân không khả dụng'
      });
    }

    // Calculate duration and price
    let bookingDuration = duration;
    let bookingTotalPrice = totalPrice;

    if (!bookingDuration) {
      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);
      bookingDuration = (endHour * 60 + endMin - startHour * 60 - startMin) / 60;
    }

    if (bookingDuration < 1 || bookingDuration > 12) {
      return res.status(400).json({
        success: false,
        message: 'Thời gian thuê từ 1-12 giờ'
      });
    }

    if (!bookingTotalPrice) {
      bookingTotalPrice = bookingDuration * field.pricePerHour;
    }

    // Check for conflicts
    const conflictingBookings = await Booking.findAll({
      where: {
        fieldId,
        bookingDate,
        status: { [Op.notIn]: ['cancelled'] },
        [Op.or]: [
          {
            [Op.and]: [
              { startTime: { [Op.lte]: startTime } },
              { endTime: { [Op.gt]: startTime } }
            ]
          },
          {
            [Op.and]: [
              { startTime: { [Op.lt]: endTime } },
              { endTime: { [Op.gte]: endTime } }
            ]
          },
          {
            [Op.and]: [
              { startTime: { [Op.gte]: startTime } },
              { endTime: { [Op.lte]: endTime } }
            ]
          },
          {
            [Op.and]: [
              { startTime: startTime },
              { endTime: endTime }
            ]
          }
        ]
      }
    });

    if (conflictingBookings.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Khung giờ này đã được đặt. Vui lòng chọn giờ khác.'
      });
    }

    // Create booking
    const booking = await Booking.create({
      userId,
      fieldId,
      bookingDate,
      startTime,
      endTime,
      duration: bookingDuration,
      totalPrice: bookingTotalPrice,
      notes: notes || null,
      status: 'pending',
      paymentStatus: 'unpaid'
    });

    // Return with details
    const bookingWithDetails = await Booking.findByPk(booking.id, {
      include: [
        { 
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'phone'] 
        },
        { 
          model: Field,
          as: 'field',
          attributes: ['id', 'name', 'fieldType', 'location', 'pricePerHour'] 
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Đặt sân thành công! Chúng tôi sẽ liên hệ xác nhận.',
      data: bookingWithDetails
    });
  } catch (error) {
    console.error('Create public booking error:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Khung giờ này đã được đặt. Vui lòng chọn giờ khác.'
      });
    }
    
    if (error.name === 'SequelizeValidationError') {
      const errors = error.errors.map(err => ({
        field: err.path,
        message: err.message
      }));
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo booking',
      error: error.message
    });
  }
};

module.exports = {
  getPublicFields,
  getPublicField,
  getAvailableSlots,
  findOrCreateCustomer,
  createPublicBooking
};