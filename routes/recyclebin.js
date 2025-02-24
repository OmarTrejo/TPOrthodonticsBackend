const { Router } = require('express');
const { body, param } = require('express-validator');

const validateRequest = require('../middleware/validateRequest');
const { getAllRecycleBin, getByIDRecycleBin } = require('../controllers/recyclebin.controller');

const router = Router();

// Get all data
router.get('/getAll', getAllRecycleBin);
router.get('/getById/:id',[
    param('id').isInt().withMessage('El ID debe ser un número entero'),
    validateRequest
], getByIDRecycleBin);


module.exports = router;