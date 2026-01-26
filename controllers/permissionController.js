const { Permission, UserPermission, User } = require('../models');
const { Op } = require('sequelize');

// @desc    Get all permissions
// @route   GET /api/permissions
// @access  Private/Superadmin
exports.getAllPermissions = async (req, res) => {
  try {
    const { category, isActive } = req.query;

    const whereClause = {};

    if (category) {
      whereClause.category = category;
    }

    if (isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    }

    const permissions = await Permission.findAll({
      where: whereClause,
      order: [['category', 'ASC'], ['name', 'ASC']]
    });

    // Group by category
    const groupedPermissions = permissions.reduce((acc, perm) => {
      if (!acc[perm.category]) {
        acc[perm.category] = [];
      }
      acc[perm.category].push(perm);
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      count: permissions.length,
      data: groupedPermissions
    });
  } catch (error) {
    console.error('Get all permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách quyền'
    });
  }
};

// @desc    Get user's permissions
// @route   GET /api/permissions/user/:userId
// @access  Private/Superadmin
exports.getUserPermissions = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Superadmin has all permissions
    if (user.role === 'superadmin') {
      const allPermissions = await Permission.findAll({
        where: { isActive: true }
      });
      
      return res.status(200).json({
        success: true,
        message: 'Superadmin có tất cả quyền',
        data: {
          userId: user.id,
          role: user.role,
          hasAllPermissions: true,
          permissions: allPermissions
        }
      });
    }

    // Get user permissions
    const userPermissions = await UserPermission.findAll({
      where: { userId: req.params.userId },
      include: [
        {
          model: Permission,
          as: 'permission',
          where: { isActive: true }
        },
        {
          model: User,
          as: 'grantor',
          attributes: ['id', 'fullName', 'email']
        }
      ],
      order: [[{ model: Permission, as: 'permission' }, 'category', 'ASC']]
    });

    res.status(200).json({
      success: true,
      data: {
        userId: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        permissionsCount: userPermissions.length,
        permissions: userPermissions
      }
    });
  } catch (error) {
    console.error('Get user permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy quyền của người dùng'
    });
  }
};

// @desc    Grant permission to user
// @route   POST /api/permissions/grant
// @access  Private/Superadmin
exports.grantPermission = async (req, res) => {
  try {
    const { userId, permissionId } = req.body;

    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Only grant to admin users
    if (user.role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể phân quyền cho Admin users'
      });
    }

    // Check if permission exists
    const permission = await Permission.findByPk(permissionId);
    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy quyền'
      });
    }

    // Check if already granted
    const existing = await UserPermission.findOne({
      where: { userId, permissionId }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Người dùng đã có quyền này'
      });
    }

    // Grant permission
    const userPermission = await UserPermission.create({
      userId,
      permissionId,
      grantedBy: req.user.id
    });

    const result = await UserPermission.findByPk(userPermission.id, {
      include: [
        { model: Permission, as: 'permission' },
        { model: User, as: 'grantor', attributes: ['id', 'fullName', 'email'] }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Phân quyền thành công',
      data: result
    });
  } catch (error) {
    console.error('Grant permission error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi phân quyền'
    });
  }
};

// @desc    Grant multiple permissions to user
// @route   POST /api/permissions/grant-multiple
// @access  Private/Superadmin
exports.grantMultiplePermissions = async (req, res) => {
  try {
    const { userId, permissionIds } = req.body;

    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Only grant to admin users
    if (user.role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể phân quyền cho Admin users'
      });
    }

    // Validate all permissions exist
    const permissions = await Permission.findAll({
      where: { id: permissionIds }
    });

    if (permissions.length !== permissionIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Một số quyền không tồn tại'
      });
    }

    // Get existing permissions
    const existing = await UserPermission.findAll({
      where: {
        userId,
        permissionId: permissionIds
      }
    });

    const existingIds = existing.map(e => e.permissionId);
    const newPermissionIds = permissionIds.filter(id => !existingIds.includes(id));

    // Grant new permissions
    const userPermissions = await Promise.all(
      newPermissionIds.map(permissionId =>
        UserPermission.create({
          userId,
          permissionId,
          grantedBy: req.user.id
        })
      )
    );

    res.status(201).json({
      success: true,
      message: `Đã phân quyền ${newPermissionIds.length} quyền mới`,
      data: {
        granted: newPermissionIds.length,
        skipped: existingIds.length,
        total: permissionIds.length
      }
    });
  } catch (error) {
    console.error('Grant multiple permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi phân quyền'
    });
  }
};

// @desc    Revoke permission from user
// @route   DELETE /api/permissions/revoke
// @access  Private/Superadmin
exports.revokePermission = async (req, res) => {
  try {
    const { userId, permissionId } = req.body;

    const userPermission = await UserPermission.findOne({
      where: { userId, permissionId }
    });

    if (!userPermission) {
      return res.status(404).json({
        success: false,
        message: 'Người dùng không có quyền này'
      });
    }

    await userPermission.destroy();

    res.status(200).json({
      success: true,
      message: 'Thu hồi quyền thành công'
    });
  } catch (error) {
    console.error('Revoke permission error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi thu hồi quyền'
    });
  }
};

// @desc    Revoke all permissions from user
// @route   DELETE /api/permissions/revoke-all/:userId
// @access  Private/Superadmin
exports.revokeAllPermissions = async (req, res) => {
  try {
    const { userId } = req.params;

    const deleted = await UserPermission.destroy({
      where: { userId }
    });

    res.status(200).json({
      success: true,
      message: `Đã thu hồi ${deleted} quyền`,
      data: {
        revokedCount: deleted
      }
    });
  } catch (error) {
    console.error('Revoke all permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi thu hồi quyền'
    });
  }
};

// @desc    Sync permissions with predefined set
// @route   POST /api/permissions/sync/:userId
// @access  Private/Superadmin
exports.syncUserPermissions = async (req, res) => {
  try {
    const { userId } = req.params;
    const { permissionIds } = req.body;

    // Check if user exists and is admin
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    if (user.role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể phân quyền cho Admin users'
      });
    }

    // Delete all existing permissions
    await UserPermission.destroy({
      where: { userId }
    });

    // Add new permissions
    if (permissionIds && permissionIds.length > 0) {
      await Promise.all(
        permissionIds.map(permissionId =>
          UserPermission.create({
            userId,
            permissionId,
            grantedBy: req.user.id
          })
        )
      );
    }

    // Get updated permissions
    const userPermissions = await UserPermission.findAll({
      where: { userId },
      include: [{ model: Permission, as: 'permission' }]
    });

    res.status(200).json({
      success: true,
      message: 'Đồng bộ quyền thành công',
      data: {
        userId,
        permissionsCount: userPermissions.length,
        permissions: userPermissions
      }
    });
  } catch (error) {
    console.error('Sync permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đồng bộ quyền'
    });
  }
};
