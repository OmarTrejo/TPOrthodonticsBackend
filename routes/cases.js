const {Router} = require('express');

const { getALLcases , addcases } = require('../controllers/cases.controller');
const authenticateUser = require('../middleware/auth');

const router = Router();

router.get('/getAll/:idUser', authenticateUser, getALLcases);
router.post('/add', authenticateUser, addcases);

module.exports = router;