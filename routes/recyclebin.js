const { Router } = require('express');
const { body, param } = require('express-validator');

const validateRequest = require('../middleware/validateRequest');
const { getAllRecycleBin, getByIDRecycleBin, restoreRecycleBin } = require('../controllers/recyclebin.controller');
const { requireAdminRole } = require('../middleware/authenticate');

const router = Router();

// Get all data
router.get('/getAll', getAllRecycleBin);
router.get('/getById/:id',[
    param('id').isInt().withMessage('El ID debe ser un número entero'),
    validateRequest,
    requireAdminRole
], getByIDRecycleBin);
router.put('/restore/:id',[
    param('id').isInt().withMessage('El ID debe ser un número entero'),
    validateRequest,
    requireAdminRole
], restoreRecycleBin);

module.exports = router;