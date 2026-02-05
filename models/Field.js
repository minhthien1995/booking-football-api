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
    allowNull: false
  },
  location: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  pricePerHour: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  image: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  openTime: {
    type: DataTypes.TIME,
    allowNull: false,
    defaultValue: '06:00:00'
  },
  closeTime: {
    type: DataTypes.TIME,
    allowNull: false,
    defaultValue: '23:00:00'
  }
}, {
  tableName: 'fields',
  timestamps: true,
  underscored: false
});

module.exports = Field;
