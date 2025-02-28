const { Router } = require('express');
const { getKPIs } = require('../controllers/kpis.controller');

const router = Router();

// * Get data user
router.get('/dashboard', getKPIs);

module.exports = router;