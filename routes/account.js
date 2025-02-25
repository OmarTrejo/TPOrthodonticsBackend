const { Router } = require('express');
const { body, param } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');
const multer = require('multer');
const { getMyAccount, updateProfile, uploadUserPhoto } = require('../controllers/account.controller');

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// * Get data user
router.get('/:id', [
    param('id', 'El id es obligatorio').not().isEmpty(),
    param('id', 'El id debe ser un número').isNumeric(),
    validateRequest
], getMyAccount);
/**
 * TODO Update profile
 */
router.put('/updateProfile/:id', [
    param('id', 'El id es obligatorio').not().isEmpty(),
    param('id', 'El id debe ser un número').isNumeric(),
    body("fullName").notEmpty().withMessage("FullName is required"),
    validateRequest
],  updateProfile);

/**
 * TODO upload and change photo
 *
 */
router.put('/updatePhoto/:id', upload.single('imageBase64'), [
    param('id', 'El id es obligatorio').not().isEmpty(),
    param('id', 'El id debe ser un número').isNumeric(),
    validateRequest
], uploadUserPhoto );
module.exports = router;