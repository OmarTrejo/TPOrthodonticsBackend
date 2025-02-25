const { Router } = require('express');
const { body } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');

const { getMyAccount } = require('../controllers/account.controller');

const router = Router();

// * Get data user
router.post('/getData', [
    body("email").notEmpty().withMessage("Email is required"),
    body("password").isLength({min:8}).withMessage("Password must be at least 8 characters long"),
    validateRequest
], getMyAccount);

module.exports = router;