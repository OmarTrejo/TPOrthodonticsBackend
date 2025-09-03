const { Router } = require('express');
const { body, param } = require('express-validator');

const { getUsers, addUser, getUserById, updateUser, updateStatus, deleteUser, getLogs, deletedMany, changePassword, disabledMFA } = require('../controllers/user.controller');
const validateRequest = require('../middleware/validateRequest');
const { requireAdminRole, requireAdminOrTechRole } = require('../middleware/authenticate');

const router = Router();


router.post('/addUser', [
    body("fullName").notEmpty().withMessage("FullName is required"),
    body("email").notEmpty().withMessage("Email is required"),
    body("roleId").notEmpty().withMessage("Role is required"),
    body("organizationId").notEmpty().withMessage("Country is required"),
    validateRequest,
    requireAdminRole
], addUser);
router.get('/getAll', requireAdminOrTechRole, getUsers);
router.get('/getById/:id', [
    param("id").notEmpty().withMessage("Id is required"),
    param('id', 'El id debe ser un número').isNumeric(),
    validateRequest,
    requireAdminRole
], getUserById);
router.put('/updateUser/:id', [
    body("fullName").notEmpty().withMessage("Fullname is required"),
    param("id").notEmpty().withMessage("Id is required"),
    param('id', 'El id debe ser un número').isNumeric(),
    validateRequest,
    requireAdminRole
], updateUser);
router.put('/updateStatus/:id', [
    body("status").notEmpty().withMessage("Status is required"),
    param("id").notEmpty().withMessage("Id is required"),
    param('id', 'El id debe ser un número').isNumeric(),
    validateRequest,
    requireAdminRole
], updateStatus);
router.delete('/deleteUser/:id', [
    param("id").notEmpty().withMessage("Id is required"),
    param('id', 'El id debe ser un número').isNumeric(),
    validateRequest,
    requireAdminRole
], deleteUser);
router.get('/getLogs/', requireAdminRole, getLogs);

router.put('/deleteMany', [
    body("ids").notEmpty().withMessage("ID´s are required"),
    validateRequest,
    requireAdminRole
], deletedMany);
router.put('/updatePassword', [
    body("token").notEmpty().withMessage("Token is required"),
    body("password").notEmpty().withMessage("Password is required"),
    body("password").isLength({min:8}).withMessage("Password must be at least 8 characters long"),
    validateRequest,
], changePassword);
router.put('/disabledMFA/:id', [
    param("id").notEmpty().withMessage("User Id is required"),
    validateRequest,
    requireAdminRole
], disabledMFA);

module.exports = router;