const { Router } = require('express');
const { body, param } = require('express-validator');

const validateRequest = require('../middleware/validateRequest');
const { getAllPermissions } = require('../controllers/permissions.controller');

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

module.exports = router;