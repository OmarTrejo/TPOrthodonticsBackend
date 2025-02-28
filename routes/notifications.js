const { Router } = require('express');
const { body, param } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');
const { getAllByUser, updateSeen } = require('../controllers/notifications.controller');

const router = Router();

// * Public login access to web app
router.get('/getAllByUser', getAllByUser);
router.put('/seen/:id', [
    param('id', 'El id es obligatorio').notEmpty(),
    validateRequest
], updateSeen);

module.exports = router;