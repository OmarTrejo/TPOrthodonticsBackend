const { Router } = require('express');
const { body } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');

const { login, addAccessRequests, forgotPassword } = require('../controllers/auth.controller');

const router = Router();

// * Login good
router.post('/login', [
    body("email").notEmpty().withMessage("Email is required"),
    body("password").isLength({min:8}).withMessage("Password must be at least 8 characters long"),
    validateRequest
], login);

// * Public forms to requests to access to web
router.post('/addAccessRequests', [
    body("fullName").notEmpty().withMessage("Fullname is required"),
    body("email").isEmail().withMessage("Must be a valid email address"),
    body("password").isLength({min:8}).withMessage("Password must be at least 8 characters long"),
    validateRequest
], addAccessRequests);

// * Public forms to requests to access to web
router.post('/forgotPassword', [
    body("email").isEmail().withMessage("Must be a valid email address"),
    validateRequest
], forgotPassword);
module.exports = router;