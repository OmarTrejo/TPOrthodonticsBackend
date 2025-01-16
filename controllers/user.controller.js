const {response} = require('express');

const usuariosGet = (req, res = response) => {
    const {q , nombre = "No name", apikey, page = 1, limit } = req.query; // request.query obtiene los parametos que son opcionales en una ruta http example http://localhost:8080/api/usuarios?q="Hola"&nombre="Omar Trejo"

    res.status(200).json({
        msg: 'get API - controlador',
        q, 
        nombre, 
        apikey,
        page,
        limit
    });
};   

const usuariosPut = (req, res = response) => 
{
    const { id } = req.params.id; // request.params.? obtiene los parametros que son obligatorios en una ruta en especifico example http://localhost:8080/api/usuarios/10 este parametro se tiene que especificar en la ruta del servicio con :nombreParametro

    res.status(400).json({
        msg: 'put API - controlador',
        id
    });
};

const usuariosPost = (req, res = response) => 
{
    const { nombre, edad } = req.body;

    res.status(201).json({
        msg: `post API - controlador`,
        nombre,
        edad
    });
};

const usuariosDelete = (req, res = response) =>
{
    res.status(200).json({
        msg: 'delete API - controlador'
    });
};

const usuariosPatch = (req, res = response) => 
{
    res.status(200).json({
        msg: 'patch API - controlador'
    });
};

module.exports = {
    usuariosGet,
    usuariosPut,
    usuariosPost,
    usuariosDelete,
    usuariosPatch
}