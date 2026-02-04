const { Booking, Field, User } = require('../models');
const { Op } = require('sequelize');

// @desc    Create booking from public page (no auth required)
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
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khách hàng'
      });
    }

    // Check if field exists
    const field = await Field.findByPk(fieldId);
    if (!field || !field.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Sân không khả dụng'
      });
    }

    // ⭐ ADD THIS - Check if field is active
    if (!field.isActive) {
      return res.status(400).json({
        success: false,
        message: `Sân "${field.name}" hiện đã ngừng hoạt động. Vui lòng chọn sân khác.`,
        fieldName: field.name,
        fieldActive: false
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

    // ⭐ CHECK FOR CONFLICTS
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
          endTime: conflict.endTime
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

module.exports = { createPublicBooking };