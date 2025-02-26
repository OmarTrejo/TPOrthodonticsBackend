const { Router } = require('express');
const { body, param } = require('express-validator');

const { getUsers, addUser, getUserById, updateUser, updateStatus, deleteUser, getLogs, deletedMany, changePassword } = require('../controllers/user.controller');
const validateRequest = require('../middleware/validateRequest');

const router = Router();


router.post('/addUser', [
    body("fullName").notEmpty().withMessage("FullName is required"),
    body("email").notEmpty().withMessage("Email is required"),
    body("roleId").notEmpty().withMessage("Role is required"),
    body("organizationId").notEmpty().withMessage("Country is required"),
    validateRequest
], addUser);
router.get('/getAll', getUsers);
router.get('/getById/:id', [
    param("id").notEmpty().withMessage("Id is required"),
    param('id', 'El id debe ser un número').isNumeric(),
    validateRequest
], getUserById);
router.put('/updateUser/:id', [
    body("fullName").notEmpty().withMessage("Fullname is required"),
    param("id").notEmpty().withMessage("Id is required"),
    param('id', 'El id debe ser un número').isNumeric(),
    validateRequest
], updateUser);
router.put('/updateStatus/:id', [
    body("status").notEmpty().withMessage("Status is required"),
    param("id").notEmpty().withMessage("Id is required"),
    param('id', 'El id debe ser un número').isNumeric(),
    validateRequest
], updateStatus);
router.delete('/deleteUser/:id', [
    param("id").notEmpty().withMessage("Id is required"),
    param('id', 'El id debe ser un número').isNumeric(),
    validateRequest
], deleteUser);
router.get('/getLogs/', [], getLogs);

router.put('/deleteMany', [
    body("ids").notEmpty().withMessage("ID´s are required"),
    validateRequest
], deletedMany);
router.put('/updatePassword', [
    body("token").notEmpty().withMessage("Token is required"),
    body("password").notEmpty().withMessage("Password is required"),
    validateRequest
], changePassword);

module.exports = router;