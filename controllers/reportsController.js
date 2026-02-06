const { Booking, Field, User, sequelize, Sequelize } = require('../models');
const { Op } = Sequelize;

// ============================================
// HELPER FUNCTION - XỬ LÝ KHOẢNG THỜI GIAN
// ============================================
const getDateRange = (period, customStartDate, customEndDate) => {
  const now = new Date();
  let startDate, endDate;

  switch (period) {
    case 'today':
      startDate = new Date(now.setHours(0, 0, 0, 0));
      endDate = new Date(now.setHours(23, 59, 59, 999));
      break;
    
    case 'yesterday':
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      startDate = new Date(yesterday.setHours(0, 0, 0, 0));
      endDate = new Date(yesterday.setHours(23, 59, 59, 999));
      break;
    
    case 'this_week':
      const firstDay = now.getDate() - now.getDay();
      startDate = new Date(now.setDate(firstDay));
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
      break;
    
    case 'last_week':
      const lastWeekStart = new Date(now);
      lastWeekStart.setDate(now.getDate() - now.getDay() - 7);
      lastWeekStart.setHours(0, 0, 0, 0);
      const lastWeekEnd = new Date(lastWeekStart);
      lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
      lastWeekEnd.setHours(23, 59, 59, 999);
      startDate = lastWeekStart;
      endDate = lastWeekEnd;
      break;
    
    case 'this_month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;
    
    case 'last_month':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      break;
    
    case 'this_year':
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      break;
    
    case 'custom':
      if (!customStartDate || !customEndDate) {
        throw new Error('Custom period requires startDate and endDate');
      }
      startDate = new Date(customStartDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(customEndDate);
      endDate.setHours(23, 59, 59, 999);
      break;
    
    default:
      startDate = new Date(now.setDate(now.getDate() - 30));
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
  }

  return { startDate, endDate };
};

// ============================================
// 1. BÁO CÁO TỔNG QUAN
// ============================================
exports.getOverviewReport = async (req, res) => {
  try {
    // Lấy params từ query
    const { period = 'this_month', startDate: customStartDate, endDate: customEndDate } = req.query;
    
    // Convert period thành startDate & endDate
    const { startDate, endDate } = getDateRange(period, customStartDate, customEndDate);

    // 1. Đếm tổng số booking
    const totalBookings = await Booking.count({
      where: {
        bookingDate: {
          [Op.between]: [startDate, endDate]
        }
      }
    });

    // 2. Nhóm booking theo status
    const bookingsByStatus = await Booking.findAll({
      where: {
        bookingDate: {
          [Op.between]: [startDate, endDate]
        }
      },
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    // 3. Nhóm booking theo payment status
    const bookingsByPayment = await Booking.findAll({
      where: {
        bookingDate: {
          [Op.between]: [startDate, endDate]
        }
      },
      attributes: [
        'paymentStatus',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['paymentStatus'],
      raw: true
    });

    // 4. Tính tổng doanh thu (CHỈ booking đã thanh toán)
    const revenueResult = await Booking.findOne({
      where: {
        bookingDate: {
          [Op.between]: [startDate, endDate]
        },
        paymentStatus: 'paid'
      },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('total_price')), 'totalRevenue']
      ],
      raw: true
    });

    const totalRevenue = parseFloat(revenueResult?.totalRevenue || 0);
    const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

    // 5. Đếm khách hàng mới
    const newCustomers = await User.count({
      where: {
        role: 'customer',
        createdAt: {
          [Op.between]: [startDate, endDate]
        }
      }
    });

    // Trả về kết quả
    res.status(200).json({
      success: true,
      data: {
        period: {
          type: period,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        },
        overview: {
          totalBookings,
          totalRevenue,
          averageBookingValue,
          newCustomers
        },
        bookingsByStatus: bookingsByStatus.map(item => ({
          status: item.status,
          count: parseInt(item.count)
        })),
        bookingsByPayment: bookingsByPayment.map(item => ({
          paymentStatus: item.paymentStatus,
          count: parseInt(item.count)
        }))
      }
    });
  } catch (error) {
    console.error('Get overview report error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy báo cáo tổng quan',
      error: error.message
    });
  }
};

// ============================================
// 2. DOANH THU THEO NGÀY
// ============================================
exports.getRevenueByDate = async (req, res) => {
  try {
    const { period = 'this_month', startDate: customStartDate, endDate: customEndDate } = req.query;
    const { startDate, endDate } = getDateRange(period, customStartDate, customEndDate);

    const revenueByDate = await Booking.findAll({
      where: {
        bookingDate: {
          [Op.between]: [startDate, endDate]
        },
        paymentStatus: 'paid'
      },
      attributes: [
        'bookingDate',
        [sequelize.fn('COUNT', sequelize.col('id')), 'bookingCount'],
        [sequelize.fn('SUM', sequelize.col('total_price')), 'revenue']
      ],
      group: ['bookingDate'],
      order: [['bookingDate', 'ASC']],
      raw: true
    });

    res.status(200).json({
      success: true,
      data: {
        period: {
          type: period,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        },
        revenueByDate: revenueByDate.map(item => ({
          date: item.bookingDate,
          bookingCount: parseInt(item.bookingCount),
          revenue: parseFloat(item.revenue)
        }))
      }
    });
  } catch (error) {
    console.error('Get revenue by date error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy doanh thu theo ngày',
      error: error.message
    });
  }
};

// ============================================
// 3. HIỆU SUẤT SÂN
// ============================================
exports.getFieldPerformance = async (req, res) => {
  try {
    const { period = 'this_month', startDate: customStartDate, endDate: customEndDate } = req.query;
    const { startDate, endDate } = getDateRange(period, customStartDate, customEndDate);

    const fieldPerformance = await Booking.findAll({
      where: {
        bookingDate: {
          [Op.between]: [startDate, endDate]
        }
      },
      attributes: [
        'fieldId',
        [sequelize.fn('COUNT', sequelize.col('Booking.id')), 'totalBookings'],
        [sequelize.fn('SUM', sequelize.col('total_price')), 'totalRevenue'],
        [sequelize.fn('SUM', sequelize.col('duration')), 'totalHours']
      ],
      include: [
        {
          model: Field,
          as: 'field',
          attributes: ['id', 'name', 'fieldType', 'location', 'pricePerHour']
        }
      ],
      group: ['fieldId', 'field.id'],
      order: [[sequelize.fn('SUM', sequelize.col('total_price')), 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: {
        period: {
          type: period,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        },
        fieldPerformance: fieldPerformance.map(item => ({
          field: {
            id: item.field.id,
            name: item.field.name,
            fieldType: item.field.fieldType,
            location: item.field.location,
            pricePerHour: item.field.pricePerHour
          },
          totalBookings: parseInt(item.dataValues.totalBookings),
          totalRevenue: parseFloat(item.dataValues.totalRevenue || 0),
          totalHours: parseFloat(item.dataValues.totalHours || 0),
          averageRevenuePerBooking: parseFloat(item.dataValues.totalRevenue || 0) / parseInt(item.dataValues.totalBookings)
        }))
      }
    });
  } catch (error) {
    console.error('Get field performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy hiệu suất sân',
      error: error.message
    });
  }
};

// ============================================
// 4. TOP KHÁCH HÀNG
// ============================================
exports.getCustomerReport = async (req, res) => {
  try {
    const { period = 'this_month', startDate: customStartDate, endDate: customEndDate, limit = 10 } = req.query;
    const { startDate, endDate } = getDateRange(period, customStartDate, customEndDate);

    const topCustomers = await Booking.findAll({
      where: {
        bookingDate: {
          [Op.between]: [startDate, endDate]
        },
        paymentStatus: 'paid'
      },
      attributes: [
        'userId',
        [sequelize.fn('COUNT', sequelize.col('Booking.id')), 'totalBookings'],
        [sequelize.fn('SUM', sequelize.col('total_price')), 'totalSpent']
      ],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'phone', 'email']
        }
      ],
      group: ['userId', 'user.id'],
      order: [[sequelize.fn('SUM', sequelize.col('total_price')), 'DESC']],
      limit: parseInt(limit)
    });

    res.status(200).json({
      success: true,
      data: {
        period: {
          type: period,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        },
        topCustomers: topCustomers.map(item => ({
          customer: {
            id: item.user.id,
            fullName: item.user.fullName,
            phone: item.user.phone,
            email: item.user.email
          },
          totalBookings: parseInt(item.dataValues.totalBookings),
          totalSpent: parseFloat(item.dataValues.totalSpent),
          averagePerBooking: parseFloat(item.dataValues.totalSpent) / parseInt(item.dataValues.totalBookings)
        }))
      }
    });
  } catch (error) {
    console.error('Get customer report error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy báo cáo khách hàng',
      error: error.message
    });
  }
};

// ============================================
// 5. PHÂN TÍCH KHUNG GIỜ
// ============================================
exports.getTimeSlotAnalysis = async (req, res) => {
  try {
    const { period = 'this_month', startDate: customStartDate, endDate: customEndDate } = req.query;
    const { startDate, endDate } = getDateRange(period, customStartDate, customEndDate);

    const bookings = await Booking.findAll({
      where: {
        bookingDate: {
          [Op.between]: [startDate, endDate]
        },
        status: { [Op.notIn]: ['cancelled'] }
      },
      attributes: ['startTime', 'totalPrice']
    });

    // Tạo object chứa data cho mỗi giờ (6:00 - 22:00)
    const hourlyData = {};
    for (let hour = 6; hour <= 22; hour++) {
      hourlyData[hour] = { bookings: 0, revenue: 0 };
    }

    // Đếm số booking và tổng revenue cho mỗi giờ
    bookings.forEach(booking => {
      const hour = parseInt(booking.startTime.split(':')[0]);
      if (hourlyData[hour]) {
        hourlyData[hour].bookings++;
        hourlyData[hour].revenue += parseFloat(booking.totalPrice);
      }
    });

    // Convert object thành array
    const timeSlots = Object.entries(hourlyData).map(([hour, data]) => ({
      timeSlot: `${hour.padStart(2, '0')}:00`,
      bookings: data.bookings,
      revenue: data.revenue,
      averageRevenue: data.bookings > 0 ? data.revenue / data.bookings : 0
    }));

    res.status(200).json({
      success: true,
      data: {
        period: {
          type: period,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        },
        timeSlots
      }
    });
  } catch (error) {
    console.error('Get time slot analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi phân tích khung giờ',
      error: error.message
    });
  }
};