const {Router} = require('express');
const { body } = require('express-validator');

const { addOrganization, getAll, getById, deleteOrganization, updateOrganization, restoreOrganization } = require('../controllers/organization.controller');
const validateRequest = require('../middleware/validateRequest');

const router = Router();
router.post(
    '/add', 
    [
        body("name").notEmpty().withMessage("Name is required"),
        body("commun_name").notEmpty().withMessage("Commun name is required"),
        validateRequest
    ],
    addOrganization
);

router.get('/getAll', [], getAll);
router.get('/getById/:id', [], getById);
router.delete('/delete/:id', [], deleteOrganization);
router.put('/update/:id', [], updateOrganization);
router.post('/update/:id', [], restoreOrganization);

module.exports = router;