const {Router} = require('express');
// const validateRequest = require('../middlewares/validateRequest.js')

const { login, loginManual } = require('../controllers/auth.controller');

const router = Router();

router.post('/login', loginManual);

module.exports = router;