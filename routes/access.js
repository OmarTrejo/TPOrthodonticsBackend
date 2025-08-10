const { Router } = require('express');
const { body, param } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');

const { getRequestsAccess, approvedRequests, denyAccess } = require('../controllers/access.controller');
const { requireSupportRole } = require('../middleware/authenticate');

const router = Router();

// * Public login access to web app
router.get('/RequestAccess', getRequestsAccess);
// * Appoved the requests
router.post('/ApprovedRequest/:id', [
    param('id', 'El id es obligatorio').not().isEmpty(),
    param('id', 'El id debe ser un número').isNumeric(),
    validateRequest,
    requireSupportRole
], approvedRequests);
/**
 * @TODO Deny access to platform
 * Send email to user with a link to create a new password
 */
router.delete('/deny/:id', [
    param('id', 'El id es obligatorio').not().isEmpty(),
    param('id', 'El id debe ser un número').isNumeric(),
    validateRequest,
    requireSupportRole
], denyAccess);

module.exports = router;