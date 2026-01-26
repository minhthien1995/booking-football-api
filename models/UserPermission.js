const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserPermission = sequelize.define('UserPermission', {
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
  permissionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'permission_id',
    references: {
      model: 'permissions',
      key: 'id'
    }
  },
  grantedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'granted_by',
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'ID of superadmin who granted this permission'
  },
  grantedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'granted_at'
  }
}, {
  tableName: 'user_permissions',
  timestamps: false,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'permission_id'],
      name: 'unique_user_permission'
    }
  ]
});

module.exports = UserPermission;
