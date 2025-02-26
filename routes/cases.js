const { Router } = require('express');
const { body, param } = require('express-validator');

const multer = require('multer');
const validateRequest = require('../middleware/validateRequest');

const { getAllCases, createCase } = require('../controllers/cases.controller');

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/getAll', getAllCases );
router.post('/addCase', upload.single('attachmentFormBase64'), [
    body("name").notEmpty().withMessage("Name is required"),
    body("patientName").notEmpty().withMessage("Patient name is required"),
    body("treatmentTypeId").notEmpty().withMessage("Treatment Type is required"),
    body("treatmentTypeId").notEmpty().withMessage("Treatment Type is required"),
    validateRequest
], createCase)

// router.post('/getAll', [
//     body("name").notEmpty().withMessage("Name is required"),
//     body("commonName").notEmpty().withMessage("Commun name is required"),
//     body("countryId").notEmpty().withMessage("Country is required"),
//     validateRequest
// ],addOrganization);

module.exports = router;