/**
 * Role-based authorization middleware
 * Usage:
 *   const authorize = require('./middlewares/authorize');
 *   router.get('/admin', authenticate, authorize('Admin'), handler);
 *   router.get('/manage', authenticate, authorize('Admin','Manager'), handler);
 */

module.exports = function authorize(...allowedRoles) {
  // support passing an array as first arg
  if (allowedRoles.length === 1 && Array.isArray(allowedRoles[0])) {
    allowedRoles = allowedRoles[0];
  }

  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized: no user attached' });
      }

      const userRole = req.user.role || req.user?.role;
      if (!userRole) {
        return res.status(403).json({ error: 'Forbidden: user has no role' });
      }

      // allow if userRole matches any of allowedRoles
      const allowed = allowedRoles.some((r) => r === userRole);
      if (!allowed) {
        return res.status(403).json({ error: 'Forbidden: insufficient role' });
      }

      return next();
    } catch (err) {
      return next(err);
    }
  };
};
