const { Router } = require('express');
const { body, param } = require('express-validator');

const validateRequest = require('../middleware/validateRequest');
const { getAllPermissions, updateManyPermissions } = require('../controllers/permissions.controller');
const { requireAdminRole } = require('../middleware/authenticate');

const router = Router();

/**
 * @swagger
 * /api/permissions/getAll:
 *   get:
 *     summary: Get all permissions
 *     description: Retrieve a list of all permissions.
 *     tags:
 *       - Permissions
 *     responses:
 *       200:
 *         description: Successful operation
 *       500:
 *         description: Internal server error
 */
router.get('/getAll', getAllPermissions);
router.put('/updatePermissions', [
    body().isArray().withMessage('El cuerpo de la petición debe ser un arreglo'),
    validateRequest,
    requireAdminRole
], updateManyPermissions);

module.exports = router;