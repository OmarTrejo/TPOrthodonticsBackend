const {Router} = require('express');
// const validateRequest = require('../middlewares/validateRequest.js')

const { login } = require('../controllers/auth.controller');

const router = Router();

router.post('/login', login);

module.exports = router;