const { Router } = require('express');
const { body, param } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');

const { getRequestsAccess, approvedRequests } = require('../controllers/access.controller');

const router = Router();

// * Public login access to web app
router.get('/RequestAccess', getRequestsAccess);
// * Appoved the requests
router.post('/ApprovedRequest/:id', [
    param('id', 'El id es obligatorio').not().isEmpty(),
    param('id', 'El id debe ser un número').isNumeric(),
    validateRequest
], approvedRequests);

module.exports = router;