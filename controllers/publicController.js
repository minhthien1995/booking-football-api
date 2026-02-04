const { Field, Booking, User } = require('../models');
const { Op } = require('sequelize');
const NotificationService = require('../services/notificationService');

// @desc    Get all active fields for public
// @route   GET /api/public/fields
// @access  Public
exports.getPublicFields = async (req, res) => {
  try {
    const { search, fieldType, showInactive } = req.query;
    
    const whereClause = showInactive === 'true' 
      ? {} 
      : { isActive: true };

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { location: { [Op.like]: `%${search}%` } }
      ];
    }

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

// @desc    Get single field for public
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

// @desc    Get available slots
// @route   GET /api/public/fields/:fieldId/slots/:date
// @access  Public
exports.getAvailableSlots = async (req, res) => {
  try {
    const { fieldId, date } = req.params;

    const field = await Field.findOne({
      where: {
        id: fieldId,
        isActive: true
      }
    });

    if (!field) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sân '
      });
    }

    const bookings = await Booking.findAll({
      where: {
        fieldId,
        bookingDate: date,
        status: { [Op.notIn]: ['cancelled'] }
      },
      attributes: ['startTime', 'endTime'],
      order: [['startTime', 'ASC']]
    });

    const slots = [];
    for (let hour = 6; hour < 22; hour++) {
      const startTime = `${hour.toString().padStart(2, '0')}:00`;
      const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;

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

// @desc    Find or create customer
// @route   POST /api/public/customers/find-or-create
// @access  Public
exports.findOrCreateCustomer = async (req, res) => {
  try {
    const { phone, fullName } = req.body;

    if (!phone || !fullName) {
      return res.status(400).json({
        success: false,
        message: 'Số điện thoại và họ tên là bắt buộc'
      });
    }

    const phoneRegex = /^0\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0)'
      });
    }

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

    if (!userId || !fieldId || !bookingDate || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc'
      });
    }

    const user = await User.findByPk(userId);
    if (!user || user.role !== 'customer') {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khách hàng'
      });
    }

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

    // ⭐ CREATE NOTIFICATION IN DATABASE
    try {
      await NotificationService.createForAdmins({
        type: 'new_booking',
        title: `Booking mới từ ${bookingWithDetails.user.fullName}`,
        message: `${bookingWithDetails.user.fullName} đã đặt ${bookingWithDetails.field.name} vào ${bookingDate} từ ${startTime} đến ${endTime}`,
        notificationData: {
          bookingId: booking.id,
          customerId: userId,
          customerName: bookingWithDetails.user.fullName,
          customerPhone: bookingWithDetails.user.phone,
          fieldId: fieldId,
          fieldName: bookingWithDetails.field.name,
          bookingDate: bookingDate,
          startTime: startTime,
          endTime: endTime,
          totalPrice: bookingTotalPrice
        },
        priority: 'high'
      });
      console.log('✅ Notification saved to database');
    } catch (notifError) {
      console.error('⚠️ Failed to create notification:', notifError.message);
      // Don't fail the booking if notification fails
    }


    // ⭐ EMIT SOCKET EVENT TO ADMIN
    const io = req.app.get('socketio');
    if (io) {
      io.emit('new-booking', {
        bookingId: booking.id,
        customerName: bookingWithDetails.user.fullName,
        customerPhone: bookingWithDetails.user.phone,
        fieldName: bookingWithDetails.field.name,
        bookingDate: bookingDate,
        startTime: startTime,
        endTime: endTime,
        totalPrice: bookingTotalPrice,
        createdAt: new Date().toISOString(),
        message: `Booking mới từ ${bookingWithDetails.user.fullName}`
      });
      console.log('🔔 Notification sent to admin for booking:', booking.id);
    }

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

// @desc    Find available fields by date and time
// @route   GET /api/public/fields/search-available?date=YYYY-MM-DD&startTime=HH:mm&endTime=HH:mm
// @access  Public
exports.findAvailableFields = async (req, res) => {
  try {
    const { date, startTime, endTime } = req.query;
    // Validation
    if (!date || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ: date, startTime, endTime'
      });
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        message: 'Định dạng ngày không hợp lệ (YYYY-MM-DD)'
      });
    }

    // Validate time format
    const timeRegex = /^\d{2}:\d{2}$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return res.status(400).json({
        success: false,
        message: 'Định dạng giờ không hợp lệ (HH:mm)'
      });
    }

    // Validate time logic
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (endMinutes <= startMinutes) {
      return res.status(400).json({
        success: false,
        message: 'Giờ kết thúc phải sau giờ bắt đầu'
      });
    }

    const duration = (endMinutes - startMinutes) / 60;
    if (duration < 1 || duration > 12) {
      return res.status(400).json({
        success: false,
        message: 'Thời gian thuê từ 1-12 giờ'
      });
    }

    // Get all active fields
    const allFields = await Field.findAll({
      where: { isActive: true },
      attributes: ['id', 'name', 'fieldType', 'location', 'description', 'pricePerHour'],
      order: [['name', 'ASC']]
    });

    if (allFields.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không có sân nào khả dụng'
      });
    }

    // Get all bookings for this date
    const bookings = await Booking.findAll({
      where: {
        bookingDate: date,
        status: { [Op.notIn]: ['cancelled'] }
      },
      attributes: ['fieldId', 'startTime', 'endTime'],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['fullName', 'phone']
        }
      ]
    });

    // Check each field for availability
    const availableFields = [];
    const unavailableFields = [];

    for (const field of allFields) {
      // Get bookings for this specific field
      const fieldBookings = bookings.filter(b => b.fieldId === field.id);

      // Check if requested time slot conflicts with any booking
      const hasConflict = fieldBookings.some(booking => {
        const bookingStart = booking.startTime.substring(0, 5);
        const bookingEnd = booking.endTime.substring(0, 5);

        return (
          (startTime >= bookingStart && startTime < bookingEnd) ||
          (endTime > bookingStart && endTime <= bookingEnd) ||
          (startTime <= bookingStart && endTime >= bookingEnd)
        );
      });

      const totalPrice = duration * field.pricePerHour;

      if (hasConflict) {
        // Find conflicting booking details
        const conflictingBooking = fieldBookings.find(booking => {
          const bookingStart = booking.startTime.substring(0, 5);
          const bookingEnd = booking.endTime.substring(0, 5);
          return (
            (startTime >= bookingStart && startTime < bookingEnd) ||
            (endTime > bookingStart && endTime <= bookingEnd) ||
            (startTime <= bookingStart && endTime >= bookingEnd)
          );
        });

        unavailableFields.push({
          id: field.id,
          name: field.name,
          fieldType: field.fieldType,
          location: field.location,
          pricePerHour: field.pricePerHour,
          estimatedPrice: totalPrice,
          available: false,
          reason: 'Đã có người đặt',
          conflictingBooking: {
            startTime: conflictingBooking.startTime.substring(0, 5),
            endTime: conflictingBooking.endTime.substring(0, 5),
            customerName: conflictingBooking.user?.fullName || 'N/A'
          }
        });
      } else {
        availableFields.push({
          id: field.id,
          name: field.name,
          fieldType: field.fieldType,
          location: field.location,
          description: field.description,
          pricePerHour: field.pricePerHour,
          estimatedPrice: totalPrice,
          available: true
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Tìm thấy ${availableFields.length}/${allFields.length} sân trống`,
      data: {
        searchCriteria: {
          date,
          startTime,
          endTime,
          duration: `${duration} giờ`
        },
        summary: {
          totalFields: allFields.length,
          availableCount: availableFields.length,
          unavailableCount: unavailableFields.length
        },
        availableFields,
        unavailableFields
      }
    });
  } catch (error) {
    console.error('Find available fields error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tìm sân trống',
      error: error.message
    });
  }
};