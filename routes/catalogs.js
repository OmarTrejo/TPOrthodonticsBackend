const {Router} = require('express');

const { getCountries, getRoles, getTypeCase, getDCs, getCaseStatus } = require('../controllers/catalogs.controller');
const authenticateUser = require('../middleware/auth');

const router = Router();

router.get('/countries', authenticateUser, getCountries);
router.get('/roles', authenticateUser, getRoles);
router.get('/types', authenticateUser, getTypeCase);
router.get('/dcs', authenticateUser, getDCs);
router.get('/caseStatus', authenticateUser, getCaseStatus);

module.exports = router;