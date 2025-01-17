const {Router} = require('express');

const { usuariosGet, 
    usuariosPut, 
    usuariosPost, 
    usuariosDelete, 
    usuariosPatch, 
    getUsers} = require('../controllers/user.controller');

const router = Router();

router.get('/', getUsers);
router.put('/:id', usuariosPut);
router.post('/', usuariosPost);
router.delete('/', usuariosDelete);
router.patch('/', usuariosPatch);

module.exports = router;