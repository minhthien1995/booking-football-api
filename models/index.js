const { sequelize } = require('../config/database');
const Sequelize = require('sequelize');
const User = require('./User');
const Field = require('./Field');
const Booking = require('./Booking');
const Permission = require('./Permission');
const UserPermission = require('./UserPermission');
const UserRole = require('./UserRole');
const RolePermission = require('./RolePermission');
const Notification = require('./Notification');


// Define associations

// User has many Bookings
User.hasMany(Booking, {
  foreignKey: 'userId',
  as: 'bookings',
  onDelete: 'CASCADE'
});

// Booking belongs to User
Booking.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// Field has many Bookings
Field.hasMany(Booking, {
  foreignKey: 'fieldId',
  as: 'bookings',
  onDelete: 'CASCADE'
});

// Booking belongs to Field
Booking.belongsTo(Field, {
  foreignKey: 'fieldId',
  as: 'field'
});

// User and Permission many-to-many relationship (direct permissions)
User.belongsToMany(Permission, {
  through: UserPermission,
  foreignKey: 'userId',
  otherKey: 'permissionId',
  as: 'permissions'
});

Permission.belongsToMany(User, {
  through: UserPermission,
  foreignKey: 'permissionId',
  otherKey: 'userId',
  as: 'users'
});

// Direct associations for UserPermission
UserPermission.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

UserPermission.belongsTo(Permission, {
  foreignKey: 'permissionId',
  as: 'permission'
});

UserPermission.belongsTo(User, {
  foreignKey: 'grantedBy',
  as: 'grantor'
});

// UserRole and Permission many-to-many relationship
UserRole.belongsToMany(Permission, {
  through: RolePermission,
  foreignKey: 'roleId',
  otherKey: 'permissionId',
  as: 'permissions'
});

Permission.belongsToMany(UserRole, {
  through: RolePermission,
  foreignKey: 'permissionId',
  otherKey: 'roleId',
  as: 'roles'
});

// Direct associations for RolePermission
RolePermission.belongsTo(UserRole, {
  foreignKey: 'roleId',
  as: 'role'
});

RolePermission.belongsTo(Permission, {
  foreignKey: 'permissionId',
  as: 'permission'
});

// User belongs to UserRole
User.belongsTo(UserRole, {
  foreignKey: 'customRoleId',
  as: 'customRole'
});

UserRole.hasMany(User, {
  foreignKey: 'customRoleId',
  as: 'users'
});

// UserRole creator
UserRole.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'creator'
});

// ⭐ THÊM NOTIFICATION ASSOCIATIONS
// User has many Notifications
User.hasMany(Notification, {
  foreignKey: 'userId',
  as: 'notifications',
  onDelete: 'CASCADE'
});

// Notification belongs to User
Notification.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

module.exports = {
  User,
  Field,
  Booking,
  Notification,
  Permission,
  UserPermission,
  UserRole,
  RolePermission,
  sequelize,
  Sequelize
};
