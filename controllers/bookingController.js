const { Booking, Field, User } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

// Helper function to calculate end time
const calculateEndTime = (startTime, duration) => {
  const [hours, minutes] = startTime.split(':');
  const start = moment().hours(hours).minutes(minutes);
  const end = start.add(duration, 'hours');
  return end.format('HH:mm');
};

// Helper function to check if time slot is available
const isTimeSlotAvailable = async (fieldId, bookingDate, startTime, endTime, excludeBookingId = null) => {
  const whereClause = {
    fieldId,
    bookingDate,
    status: { [Op.notIn]: ['cancelled'] },
    [Op.or]: [
      {
        // New booking starts during existing booking
        startTime: { [Op.lte]: startTime },
        endTime: { [Op.gt]: startTime }
      },
      {
        // New booking ends during existing booking
        startTime: { [Op.lt]: endTime },
        endTime: { [Op.gte]: endTime }
      },
      {
        // New booking completely contains existing booking
        startTime: { [Op.gte]: startTime },
        endTime: { [Op.lte]: endTime }
      }
    ]
  };

  // Exclude current booking when updating
  if (excludeBookingId) {
    whereClause.id = { [Op.ne]: excludeBookingId };
  }

  const conflictingBookings = await Booking.findAll({ where: whereClause });
  return conflictingBookings.length === 0;
};

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private (Admin can book for customers)
exports.createBooking = async (req, res) => {
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
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khách hàng'
      });
    }

    // Check if field exists
    const field = await Field.findByPk(fieldId);
    if (!field) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sân'
      });
    }

    // Validate duration
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

    // ⭐ CHECK FOR CONFLICTING BOOKINGS
    const conflictingBookings = await Booking.findAll({
      where: {
        fieldId,
        bookingDate,
        status: { [Op.notIn]: ['cancelled'] },
        [Op.or]: [
          {
            // New booking starts during existing booking
            [Op.and]: [
              { startTime: { [Op.lte]: startTime } },
              { endTime: { [Op.gt]: startTime } }
            ]
          },
          {
            // New booking ends during existing booking
            [Op.and]: [
              { startTime: { [Op.lt]: endTime } },
              { endTime: { [Op.gte]: endTime } }
            ]
          },
          {
            // New booking completely contains existing booking
            [Op.and]: [
              { startTime: { [Op.gte]: startTime } },
              { endTime: { [Op.lte]: endTime } }
            ]
          },
          {
            // Exact same time slot
            [Op.and]: [
              { startTime: startTime },
              { endTime: endTime }
            ]
          }
        ]
      },
      include: [
        { 
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'phone'] 
        }
      ]
    });

    if (conflictingBookings.length > 0) {
      const conflict = conflictingBookings[0];
      return res.status(400).json({
        success: false,
        message: 'Khung giờ này đã được đặt',
        conflict: {
          bookingId: conflict.id,
          customerName: conflict.user?.fullName,
          startTime: conflict.startTime,
          endTime: conflict.endTime,
          bookingDate: conflict.bookingDate
        }
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

    // Return with full details
    const bookingWithDetails = await Booking.findByPk(booking.id, {
      include: [
        { 
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'email', 'phone'] 
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
      message: 'Đặt sân thành công',
      data: bookingWithDetails
    });
  } catch (error) {
    console.error('Create booking error:', error);
    
    // Handle duplicate booking constraint
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Khung giờ này đã được đặt. Vui lòng chọn giờ khác.',
        error: 'DUPLICATE_BOOKING'
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

// @desc    Get all bookings (with filters)
// @route   GET /api/bookings
// @access  Private
exports.getAllBookings = async (req, res) => {
  try {
    const { status, paymentStatus, fieldId, startDate, endDate } = req.query;

    const whereClause = {};

    // If user is not admin or superadmin, only show their bookings
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      whereClause.userId = req.user.id;
    }

    if (status) {
      whereClause.status = status;
    }

    if (paymentStatus) {
      whereClause.paymentStatus = paymentStatus;
    }

    if (fieldId) {
      whereClause.fieldId = fieldId;
    }

    if (startDate && endDate) {
      whereClause.bookingDate = {
        [Op.between]: [startDate, endDate]
      };
    } else if (startDate) {
      whereClause.bookingDate = {
        [Op.gte]: startDate
      };
    }

    const bookings = await Booking.findAll({
      where: whereClause,
      include: [
        { model: Field, as: 'field' },
        { model: User, as: 'user' }
      ],
      order: [['bookingDate', 'DESC'], ['startTime', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    console.error('Get all bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách đặt sân'
    });
  }
};

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private
exports.getBooking = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: [
        { model: Field, as: 'field' },
        { model: User, as: 'user' }
      ]
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn đặt sân'
      });
    }

    // Check if user owns this booking or is admin/superadmin
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin' && booking.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập đơn đặt sân này'
      });
    }

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin đặt sân'
    });
  }
};

// @desc    Update booking
// @route   PUT /api/bookings/:id
// @access  Private
exports.updateBooking = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn đặt sân'
      });
    }

    // Check if user owns this booking or is admin/superadmin
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin' && booking.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền cập nhật đơn đặt sân này'
      });
    }

    // Don't allow update if booking is completed or cancelled
    if (['completed', 'cancelled'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: 'Không thể cập nhật đơn đặt sân đã hoàn thành hoặc đã hủy'
      });
    }

    const { bookingDate, startTime, duration, notes, status, paymentStatus, paymentMethod } = req.body;

    // If changing time, check availability
    if (bookingDate || startTime || duration) {
      const newBookingDate = bookingDate || booking.bookingDate;
      const newStartTime = startTime || booking.startTime;
      const newDuration = duration || booking.duration;
      const newEndTime = calculateEndTime(newStartTime, newDuration);

      const isAvailable = await isTimeSlotAvailable(
        booking.fieldId,
        newBookingDate,
        newStartTime,
        newEndTime,
        booking.id
      );

      if (!isAvailable) {
        return res.status(400).json({
          success: false,
          message: 'Khung giờ mới đã được đặt. Vui lòng chọn khung giờ khác'
        });
      }

      booking.bookingDate = newBookingDate;
      booking.startTime = newStartTime;
      booking.duration = newDuration;
      booking.endTime = newEndTime;

      // Recalculate total price if duration changed
      if (duration) {
        const field = await Field.findByPk(booking.fieldId);
        booking.totalPrice = parseFloat(field.pricePerHour) * newDuration;
      }
    }

    if (notes !== undefined) booking.notes = notes;
    if (status && (req.user.role === 'admin' || req.user.role === 'superadmin')) booking.status = status;
    if (paymentStatus && (req.user.role === 'admin' || req.user.role === 'superadmin')) booking.paymentStatus = paymentStatus;
    if (paymentMethod) booking.paymentMethod = paymentMethod;

    await booking.save();

    // Get updated booking with details
    const updatedBooking = await Booking.findByPk(booking.id, {
      include: [
        { model: Field, as: 'field' },
        { model: User, as: 'user' }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Cập nhật đơn đặt sân thành công',
      data: updatedBooking
    });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật đặt sân'
    });
  }
};

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn đặt sân'
      });
    }

    // Check if user owns this booking or is admin/superadmin
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin' && booking.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền hủy đơn đặt sân này'
      });
    }

    // Don't allow cancel if already cancelled or completed
    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Đơn đặt sân đã được hủy trước đó'
      });
    }

    if (booking.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Không thể hủy đơn đặt sân đã hoàn thành'
      });
    }

    booking.status = 'cancelled';
    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Hủy đơn đặt sân thành công',
      data: booking
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi hủy đặt sân'
    });
  }
};

// @desc    Get available time slots for a field on a specific date
// @route   GET /api/bookings/available-slots/:fieldId/:date
// @access  Public
exports.getAvailableSlots = async (req, res) => {
  try {
    const { fieldId, date } = req.params;

    // Check if field exists
    const field = await Field.findByPk(fieldId);
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
      order: [['startTime', 'ASC']]
    });

    // Generate all possible time slots (assuming 1-hour intervals)
    const slots = [];
    const openHour = parseInt(field.openTime.split(':')[0]);
    const closeHour = parseInt(field.closeTime.split(':')[0]);

    for (let hour = openHour; hour < closeHour; hour++) {
      const startTime = `${hour.toString().padStart(2, '0')}:00`;
      const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;

      // Check if this slot conflicts with any booking
      const isBooked = bookings.some(booking => {
        return (
          (startTime >= booking.startTime && startTime < booking.endTime) ||
          (endTime > booking.startTime && endTime <= booking.endTime) ||
          (startTime <= booking.startTime && endTime >= booking.endTime)
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
      message: 'Lỗi server khi lấy thông tin khung giờ'
    });
  }
};
