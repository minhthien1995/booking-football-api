const express = require('express');
const router = express.Router();
const notificationsController = require('../controllers/notificationsController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);
router.use(authorize('admin', 'superadmin'));

// GET /api/notifications - Get all notifications
router.get('/', notificationsController.getNotifications);

// GET /api/notifications/unread-count - Get unread count
router.get('/unread-count', notificationsController.getUnreadCount);

// PUT /api/notifications/:id/read - Mark as read
router.put('/:id/read', notificationsController.markAsRead);

// PUT /api/notifications/read-all - Mark all as read
router.put('/read-all', notificationsController.markAllAsRead);

// DELETE /api/notifications/:id - Delete notification
router.delete('/:id', notificationsController.deleteNotification);

// DELETE /api/notifications - Delete all
router.delete('/', notificationsController.deleteAll);

module.exports = router;