const { Router } = require('express');
const { body, param } = require('express-validator');

const { addOrganization, getAll, getById, deleteOrganization, updateOrganization, restoreOrganization, updateStatusOrganization, deletedMany } = require('../controllers/organization.controller');
const validateRequest = require('../middleware/validateRequest');
const { requireAdminRole } = require('../middleware/authenticate');

const router = Router();
router.post('/add', [
    body("name").notEmpty().withMessage("Name is required"),
    body("commonName").notEmpty().withMessage("Commun name is required"),
    body("countryId").notEmpty().withMessage("Country is required"),
    validateRequest
],addOrganization);
router.get('/getAll', [], getAll);
router.get('/getById/:id', [
    param('id', 'El id es obligatorio').not().isEmpty(),
    param('id', 'El id debe ser un número').isNumeric(),
    validateRequest,
    requireAdminRole
], getById);
router.put('/updateStatus/:id', [
    param('id', 'El id es obligatorio').not().isEmpty(),
    param('id', 'El id debe ser un número').isNumeric(),
    validateRequest,
    requireAdminRole
], updateStatusOrganization);
router.delete('/delete/:id', [
    param('id', 'El id es obligatorio').not().isEmpty(),
    param('id', 'El id debe ser un número').isNumeric(),
    validateRequest,
    requireAdminRole
], deleteOrganization);
router.put('/update/:id', [
    body("name").notEmpty().withMessage("Name is required"),
    body("commonName").notEmpty().withMessage("Commun name is required"),
    param('id', 'El id es obligatorio').not().isEmpty(),
    param('id', 'El id debe ser un número').isNumeric(),
    validateRequest,
    requireAdminRole
], updateOrganization);
router.post('/update/:id', [
    param('id', 'El id es obligatorio').not().isEmpty(),
    param('id', 'El id debe ser un número').isNumeric(),
    validateRequest,
    requireAdminRole
], restoreOrganization);
router.put('/deleteMany', [
    body("ids").notEmpty().withMessage("ID´s are required"),
    validateRequest
], deletedMany);

module.exports = router;