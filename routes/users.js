const { Router } = require('express');
const { body } = require('express-validator');

const { getUsers, addUser } = require('../controllers/user.controller');
const validateRequest = require('../middleware/validateRequest');

const router = Router();

router.get('/', getUsers);
router.post('/addUser', [
    body("fullname").notEmpty().withMessage("Name is required"),
    body("email").notEmpty().withMessage("Email is required"),
    body("role_id").notEmpty().withMessage("Role is required"),
    body("dc_id").notEmpty().withMessage("Country is required"),
    validateRequest
],
    addUser);

module.exports = router;