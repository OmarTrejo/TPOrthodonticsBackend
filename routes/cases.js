const { Router } = require('express');
const { body, param } = require('express-validator');

const multer = require('multer');
const validateRequest = require('../middleware/validateRequest');

const { getAllCases, createCase, updateUrlViewer, updateOrderNumber, assignedCase, uploadMultipleFiles, addMessagesCase } = require('../controllers/cases.controller');

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/getAll', getAllCases );
router.post('/addCase', upload.single('attachmentFormBase64'), [
    body("name").notEmpty().withMessage("Name is required"),
    body("patientName").notEmpty().withMessage("Patient name is required"),
    body("treatmentTypeId").notEmpty().withMessage("Treatment Type is required"),
    validateRequest
], createCase);
router.put('/updateUrlViewer/:id', [
    param("id").notEmpty().withMessage("Id is required"),
    body("urlViewer").notEmpty().withMessage("URL Viewer is required"),
    validateRequest
], updateUrlViewer);
router.put('/updateOrderNumber/:id', [
    param("id").notEmpty().withMessage("Id is required"),
    body("orderNumber").notEmpty().withMessage("Order Number is required"),
    validateRequest
], updateOrderNumber);
router.put('/assignedCase/:id', [
    param("id").notEmpty().withMessage("Id is required"),
    validateRequest
], assignedCase);
router.post('/uploadMultipleFiles', upload.array('attachments', 5), [
    body("caseId").notEmpty().withMessage("Case ID is required"),
    validateRequest
], uploadMultipleFiles);
router.post('/addMessagesCase', [
    body("caseId").notEmpty().withMessage("Case ID is required"),
    body("message").notEmpty().withMessage("Message is required"),
    body("caseStatusId").notEmpty().withMessage("Case status is required"),
    validateRequest
], addMessagesCase)

// router.post('/getAll', [
//     body("name").notEmpty().withMessage("Name is required"),
//     body("commonName").notEmpty().withMessage("Commun name is required"),
//     body("countryId").notEmpty().withMessage("Country is required"),
//     validateRequest
// ],addOrganization);

module.exports = router;