const { Router } = require('express');
const { body, param } = require('express-validator');

const { getUsers, addUser, getUserById, updateUser, updateStatus, deleteUser, getLogs } = require('../controllers/user.controller');
const validateRequest = require('../middleware/validateRequest');

const router = Router();


router.post('/addUser', [
    body("fullName").notEmpty().withMessage("Name is required"),
    body("email").notEmpty().withMessage("Email is required"),
    body("role_id").notEmpty().withMessage("Role is required"),
    body("dc_id").notEmpty().withMessage("Country is required"),
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
module.exports = router;