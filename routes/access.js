const { Router } = require('express');
const { body } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');

const { getRequestsAccess } = require('../controllers/access.controller');

const router = Router();

// * Public login access to web app
router.get('/RequestAccess', getRequestsAccess);

module.exports = router;