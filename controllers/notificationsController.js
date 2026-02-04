const NotificationService = require('../services/notificationService');

// Get notifications for current user
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, offset = 0, unreadOnly = false, type } = req.query;

    const notifications = await NotificationService.getForUser(userId, {
      limit: parseInt(limit),
      offset: parseInt(offset),
      unreadOnly: unreadOnly === 'true',
      type
    });

    const unreadCount = await NotificationService.getUnreadCount(userId);

    res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount,
        total: notifications.length
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông báo',
      error: error.message
    });
  }
};

// Get unread count
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await NotificationService.getUnreadCount(userId);

    res.status(200).json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi đếm thông báo',
      error: error.message
    });
  }
};

// Mark as read
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const notification = await NotificationService.markAsRead(parseInt(id), userId);

    res.status(200).json({
      success: true,
      message: 'Đã đánh dấu đọc',
      data: notification
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi đánh dấu đọc',
      error: error.message
    });
  }
};

// Mark all as read
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await NotificationService.markAllAsRead(userId);

    res.status(200).json({
      success: true,
      message: `Đã đánh dấu đọc ${count} thông báo`,
      data: { count }
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi đánh dấu tất cả đã đọc',
      error: error.message
    });
  }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    await NotificationService.softDelete(parseInt(id), userId);

    res.status(200).json({
      success: true,
      message: 'Đã xóa thông báo'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi xóa thông báo',
      error: error.message
    });
  }
};

// Delete all notifications
exports.deleteAll = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await NotificationService.deleteAllForUser(userId);

    res.status(200).json({
      success: true,
      message: `Đã xóa ${count} thông báo`,
      data: { count }
    });
  } catch (error) {
    console.error('Delete all error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa tất cả thông báo',
      error: error.message
    });
  }
};