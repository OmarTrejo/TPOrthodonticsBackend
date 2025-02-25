const { Router } = require('express');
const { body, param } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');
const multer = require('multer');
const { getMyAccount, updateProfile, uploadUserPhoto } = require('../controllers/account.controller');

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// * Get data user
router.get('/:id', getMyAccount);
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
module.exports = router;