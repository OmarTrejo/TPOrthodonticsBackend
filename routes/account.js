const { Router } = require('express');
const { body, param } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');
const multer = require('multer');
const { getMyAccount, updateProfile, uploadUserPhoto, enabledMFA, veryfiedMFA, disabledMFA } = require('../controllers/account.controller');

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// * Get data user
router.get('/', getMyAccount);
/**
 * TODO Update profile
 */
router.put('/updateProfile', [
    body("fullName").notEmpty().withMessage("FullName is required"),
    validateRequest
],  updateProfile);

/**
 * TODO upload and change photo
 *
 */
router.put('/updatePhoto', upload.single('imageBase64'),uploadUserPhoto );
/** 
 * Generate a QR code for MFA
 * And save into Database the secret created
 */
router.put('/enabledMFA', enabledMFA);
router.put('/verifiedMFA', [
    body("token").notEmpty().withMessage("Token is required"),
    validateRequest
], veryfiedMFA);
router.put('/disabledMFA', disabledMFA);

module.exports = router;