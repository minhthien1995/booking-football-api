const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Booking = sequelize.define('Booking', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  fieldId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'field_id',
    references: {
      model: 'fields',
      key: 'id'
    }
  },
  bookingDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'booking_date'
  },
  startTime: {
    type: DataTypes.TIME,
    allowNull: false,
    field: 'start_time'
  },
  endTime: {
    type: DataTypes.TIME,
    allowNull: false,
    field: 'end_time'
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Duration in hours'
  },
  totalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'total_price'
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'completed'),
    defaultValue: 'pending',
    allowNull: false
  },
  paymentStatus: {
    type: DataTypes.ENUM('unpaid', 'paid', 'refunded'),
    defaultValue: 'unpaid',
    allowNull: false,
    field: 'payment_status'
  },
  paymentMethod: {
    type: DataTypes.ENUM('cash', 'bank_transfer', 'momo', 'vnpay'),
    allowNull: true,
    field: 'payment_method'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  bookingCode: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    field: 'booking_code'
  }
}, {
  tableName: 'bookings',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['field_id', 'booking_date', 'start_time', 'end_time'],
      name: 'unique_booking_slot'
    }
  ]
});

Booking.beforeValidate((booking) => {
  const now = new Date();
  const date = now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0');
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let random = '';
  for (let i = 0; i < 4; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  booking.bookingCode = `BK-${date}-${random}`;
});

module.exports = Booking;
