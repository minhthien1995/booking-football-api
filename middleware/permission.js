const { Permission, UserPermission, UserRole, RolePermission } = require('../models');

/**
 * Check if user has specific permission (from custom role or direct assignment)
 * Usage: router.use(checkPermission('create_fields'))
 */
exports.checkPermission = (...permissionNames) => {
  return async (req, res, next) => {
    try {
      // Superadmin has all permissions
      if (req.user.role === 'superadmin') {
        return next();
      }

      // Customer has no admin permissions
      if (req.user.role === 'customer') {
        return res.status(403).json({
          success: false,
          message: 'Khách hàng không có quyền truy cập chức năng này'
        });
      }

      // Check permissions from custom role first
      if (req.user.customRoleId) {
        const rolePermissions = await RolePermission.findAll({
          where: { roleId: req.user.customRoleId },
          include: [{
            model: Permission,
            as: 'permission',
            where: {
              name: permissionNames,
              isActive: true
            }
          }]
        });

        if (rolePermissions.length > 0) {
          return next();
        }
      }

      // Check direct permissions assigned to user
      const userPermissions = await UserPermission.findAll({
        where: { userId: req.user.id },
        include: [{
          model: Permission,
          as: 'permission',
          where: {
            name: permissionNames,
            isActive: true
          }
        }]
      });

      if (userPermissions.length > 0) {
        return next();
      }

      // No permission found
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thực hiện hành động này',
        requiredPermissions: permissionNames
      });
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi kiểm tra quyền'
      });
    }
  };
};

/**
 * Check if user has ANY of the specified permissions
 * Usage: router.use(checkAnyPermission(['create_fields', 'edit_fields']))
 */
exports.checkAnyPermission = (permissionNames) => {
  return async (req, res, next) => {
    try {
      // Superadmin has all permissions
      if (req.user.role === 'superadmin') {
        return next();
      }

      // Customer has no admin permissions
      if (req.user.role === 'customer') {
        return res.status(403).json({
          success: false,
          message: 'Khách hàng không có quyền truy cập chức năng này'
        });
      }

      // Check if admin has ANY of the required permissions
      const userPermissions = await UserPermission.findAll({
        where: { userId: req.user.id },
        include: [{
          model: Permission,
          as: 'permission',
          where: {
            name: permissionNames,
            isActive: true
          }
        }]
      });

      if (userPermissions.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền thực hiện hành động này',
          requiredPermissions: `Một trong: ${permissionNames.join(', ')}`
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi kiểm tra quyền'
      });
    }
  };
};

/**
 * Get user's permissions (attach to request)
 * Usage: router.use(attachUserPermissions)
 */
exports.attachUserPermissions = async (req, res, next) => {
  try {
    if (!req.user) {
      return next();
    }

    // Superadmin has all permissions
    if (req.user.role === 'superadmin') {
      req.userPermissions = ['*']; // All permissions
      return next();
    }

    // Get user permissions
    const userPermissions = await UserPermission.findAll({
      where: { userId: req.user.id },
      include: [{
        model: Permission,
        as: 'permission',
        where: { isActive: true }
      }]
    });

    req.userPermissions = userPermissions.map(up => up.permission.name);
    next();
  } catch (error) {
    console.error('Attach permissions error:', error);
    next();
  }
};

/**
 * Helper function to check permission in controller
 */
exports.hasPermission = async (userId, permissionName) => {
  try {
    const user = await require('../models').User.findByPk(userId);
    
    // Superadmin has all permissions
    if (user.role === 'superadmin') {
      return true;
    }

    // Check if user has permission
    const userPermission = await UserPermission.findOne({
      where: { userId },
      include: [{
        model: Permission,
        as: 'permission',
        where: {
          name: permissionName,
          isActive: true
        }
      }]
    });

    return !!userPermission;
  } catch (error) {
    console.error('Has permission check error:', error);
    return false;
  }
};
