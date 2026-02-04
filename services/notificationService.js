const { Notification, User } = require('../models');
const { Op } = require('sequelize');

class NotificationService {
  /**
   * Create notification for all admins
   */
  static async createForAdmins(data) {
    try {
      const { type, title, message, notificationData, priority = 'medium' } = data;

      // Get all admins and superadmins
      const admins = await User.findAll({
        where: {
          role: { [Op.in]: ['admin', 'superadmin'] },
          isActive: true
        },
        attributes: ['id']
      });

      if (admins.length === 0) {
        console.log('⚠️ No active admins found');
        return [];
      }

      // Create notification for each admin
      const notifications = await Promise.all(
        admins.map(admin =>
          Notification.create({
            userId: admin.id,
            type,
            title,
            message,
            data: notificationData,
            priority,
            isRead: false
          })
        )
      );

      console.log(`✅ Created ${notifications.length} notifications for admins`);
      return notifications;
    } catch (error) {
      console.error('Error creating notifications:', error);
      throw error;
    }
  }

  /**
   * Create notification for specific user
   */
  static async createForUser(userId, data) {
    try {
      const { type, title, message, notificationData, priority = 'medium' } = data;

      const notification = await Notification.create({
        userId,
        type,
        title,
        message,
        data: notificationData,
        priority,
        isRead: false
      });

      console.log(`✅ Created notification for user ${userId}`);
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Get notifications for user
   */
  static async getForUser(userId, options = {}) {
    const {
      limit = 50,
      offset = 0,
      unreadOnly = false,
      type = null
    } = options;

    const where = {
      userId,
      isDeleted: false
    };

    if (unreadOnly) {
      where.isRead = false;
    }

    if (type) {
      where.type = type;
    }

    const notifications = await Notification.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    return notifications;
  }

  /**
   * Get unread count for user
   */
  static async getUnreadCount(userId) {
    const count = await Notification.count({
      where: {
        userId,
        isRead: false,
        isDeleted: false
      }
    });

    return count;
  }

  /**
   * Mark as read
   */
  static async markAsRead(notificationId, userId) {
    const notification = await Notification.findOne({
      where: { id: notificationId, userId }
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    return notification;
  }

  /**
   * Mark all as read
   */
  static async markAllAsRead(userId) {
    const result = await Notification.update(
      {
        isRead: true,
        readAt: new Date()
      },
      {
        where: {
          userId,
          isRead: false,
          isDeleted: false
        }
      }
    );

    return result[0]; // Number of updated rows
  }

  /**
   * Soft delete notification
   */
  static async softDelete(notificationId, userId) {
    const notification = await Notification.findOne({
      where: { id: notificationId, userId }
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    notification.isDeleted = true;
    notification.deletedAt = new Date();
    await notification.save();

    return notification;
  }

  /**
   * Delete all notifications for user
   */
  static async deleteAllForUser(userId) {
    const result = await Notification.update(
      {
        isDeleted: true,
        deletedAt: new Date()
      },
      {
        where: {
          userId,
          isDeleted: false
        }
      }
    );

    return result[0];
  }

  /**
   * Auto cleanup old notifications (older than X days)
   */
  static async cleanup(daysOld = 30) {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - daysOld);

    const result = await Notification.destroy({
      where: {
        createdAt: { [Op.lt]: dateThreshold },
        isDeleted: true
      }
    });

    console.log(`🗑️ Cleaned up ${result} old notifications`);
    return result;
  }
}

module.exports = NotificationService;