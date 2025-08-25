const pool = require("../database/config");
const { ROLES_USER } = require("../utils/constants");

const isCaseOwnedByUser = (caseItem, user) => {
  const { id: userId, role_id } = user;

  if (role_id === ROLES_USER.ADMIN) return true; // Admins can access all cases
  if (role_id === ROLES_USER.SUPPORT) return false; // Optional: block support

  if (role_id === ROLES_USER.DOCTOR && caseItem.customer_id !== userId) return false;
  if (role_id === ROLES_USER.TECH && caseItem.tech_id !== userId) return false;

  return true; // If none of the above conditions fail
};

const requireAdminRole = (req, res, next) => {
    if (req.user.role_id !== ROLES_USER.ADMIN) return res.status(403).json({ message: 'Only administrators are allowed to access this resource.' });
    next();
}

const requireAdminOrTechRole = (req, res, next) => {
    if (req.user.role_id !== ROLES_USER.ADMIN && req.user.role_id !== ROLES_USER.TECH) return res.status(403).json({ message: 'Only administrators or techs are allowed to access this resource.' });
    next();
}

const authorizeCaseAccess = async (req, res, next) => {
    const caseId = req.params.id;
    try {
        const [rows] = await pool.query('SELECT * FROM vw_cases WHERE id = ?', [caseId]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Resource not found' });
        }

        const caseItem = rows[0];

        // Verificar si el usuario tiene acceso al caso
        if (!isCaseOwnedByUser(caseItem, req.user)) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        req.case = caseItem;

        next();
    } catch (error) {
        next(error)
    }
};

const requireSupportRole = (req, res, next) => {
  if (
    req.user.role_id !== ROLES_USER.SUPPORT &&
    req.user.role_id !== ROLES_USER.ADMIN
  ) {
    return res.status(403).json({
      message: 'Only Support or Admin users are allowed to access this resource.'
    });
  }
  next();
};

module.exports = { authorizeCaseAccess, requireAdminRole, requireSupportRole, requireAdminOrTechRole };