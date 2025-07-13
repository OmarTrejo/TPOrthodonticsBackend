const { Router } = require('express');
const { body, param } = require('express-validator');

const multer = require('multer');
const validateRequest = require('../middleware/validateRequest');
const { authorizeCaseAccess } = require('../middleware/authenticate');

const { getAllCases, createCase, updateUrlViewer, updateOrderNumber, assignedCase, uploadMultipleFiles, addMessagesCase, getCaseById, getMessageCases, getFilesCases, deleteCase, deleteManyCases, deleteFile } = require('../controllers/cases.controller');

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/getAll', getAllCases );
router.post('/addCase', upload.single('attachmentTreatmentType'), [
    body("name").notEmpty().withMessage("Name is required"),
    body("patientName").notEmpty().withMessage("Patient name is required"),
    body("treatmentTypeId").notEmpty().withMessage("Treatment Type is required"),
    validateRequest
], createCase);
router.put('/updateUrlViewer/:id', [
    param("id").notEmpty().withMessage("Id is required"),
    body("urlViewer").notEmpty().withMessage("URL Viewer is required"),
    validateRequest,
    authorizeCaseAccess
], updateUrlViewer);
router.put('/updateOrderNumber/:id', [
    param("id").notEmpty().withMessage("Id is required"),
    body("orderNumber").notEmpty().withMessage("Order Number is required"),
    validateRequest,
    authorizeCaseAccess
], updateOrderNumber);
router.put('/assignedCase/:id', [
    param("id").notEmpty().withMessage("Id is required"),
    validateRequest,
    authorizeCaseAccess
], assignedCase);
router.post('/uploadMultipleFiles', upload.array('attachments', 5), [
    body("caseId").notEmpty().withMessage("Case ID is required"),
    validateRequest
], uploadMultipleFiles);
router.post('/addMessagesCase', [
    body("caseId").notEmpty().withMessage("Case ID is required"),
    body("message").notEmpty().withMessage("Message is required"),
    validateRequest
], addMessagesCase);
router.get('/getCaseById/:id',[
    param("id").notEmpty().withMessage("Id is required"),
    validateRequest,
    authorizeCaseAccess
], getCaseById)
router.get('/getMessageCases/:id', [
    param("id").notEmpty().withMessage("Id is required"),
    validateRequest,
    authorizeCaseAccess
], getMessageCases);
router.get('/getFilesCases/:id', [
    param("id").notEmpty().withMessage("Id is required"),
    validateRequest,
    authorizeCaseAccess
], getFilesCases);
router.delete('/deleteCase/:id', [
    param("id").notEmpty().withMessage("Id is required"),
    validateRequest,
    authorizeCaseAccess
], deleteCase)
router.put('/deleteManyCases', [
    body("ids").notEmpty().withMessage("Ids is required"),
    validateRequest
], deleteManyCases)
router.delete('/deleteFile/:id', [
    param("id").notEmpty().withMessage("Id is required"),
    validateRequest,
    authorizeCaseAccess
], deleteFile)

module.exports = router;