const { Router } = require('express');
const { body, param } = require('express-validator');

const { addOrganization, getAll, getById, deleteOrganization, updateOrganization, restoreOrganization, updateStatusOrganization, deletedMany } = require('../controllers/organization.controller');
const validateRequest = require('../middleware/validateRequest');

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
    validateRequest
], getById);
router.put('/updateStatus/:id', [
    param('id', 'El id es obligatorio').not().isEmpty(),
    param('id', 'El id debe ser un número').isNumeric(),
    validateRequest
], updateStatusOrganization);
router.delete('/delete/:id', [
    param('id', 'El id es obligatorio').not().isEmpty(),
    param('id', 'El id debe ser un número').isNumeric(),
    validateRequest
], deleteOrganization);
router.put('/update/:id', [
    body("name").notEmpty().withMessage("Name is required"),
    body("commonName").notEmpty().withMessage("Commun name is required"),
    param('id', 'El id es obligatorio').not().isEmpty(),
    param('id', 'El id debe ser un número').isNumeric(),
    validateRequest
], updateOrganization);
router.post('/update/:id', [
    param('id', 'El id es obligatorio').not().isEmpty(),
    param('id', 'El id debe ser un número').isNumeric(),
    validateRequest
], restoreOrganization);
router.put('/deleteMany', [
    body("ids").notEmpty().withMessage("ID´s are required"),
    validateRequest
], deletedMany);

module.exports = router;