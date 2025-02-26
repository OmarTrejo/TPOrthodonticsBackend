const { Router } = require('express');
const { body, param } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');

const { getAllCases } = require('../controllers/cases.controller');

const router = Router();
router.get('/getAll', getAllCases );


// router.post('/getAll', [
//     body("name").notEmpty().withMessage("Name is required"),
//     body("commonName").notEmpty().withMessage("Commun name is required"),
//     body("countryId").notEmpty().withMessage("Country is required"),
//     validateRequest
// ],addOrganization);

module.exports = router;