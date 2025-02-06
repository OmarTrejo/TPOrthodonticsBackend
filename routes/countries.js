const {Router} = require('express');

const { getCountries } = require('../controllers/country.controller');
const authenticateUser = require('../middleware/auth');

const router = Router();

router.get('/', authenticateUser, getCountries);

module.exports = router;