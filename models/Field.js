const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Field = sequelize.define('Field', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  fieldType: {
    type: DataTypes.ENUM('5vs5', '7vs7', '11vs11'),
    allowNull: false,
    field: 'field_type',
    comment: 'Type of football field'
  },
  location: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  pricePerHour: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'price_per_hour'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  image: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Image URL or path'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  openTime: {
    type: DataTypes.TIME,
    allowNull: false,
    defaultValue: '06:00:00',
    field: 'open_time'
  },
  closeTime: {
    type: DataTypes.TIME,
    allowNull: false,
    defaultValue: '23:00:00',
    field: 'close_time'
  }
}, {
  tableName: 'fields',
  timestamps: true,
  underscored: true
});

module.exports = Field;
