const {response} = require('express');
const pool = require("../database/config.js");
const { generateTempPassword, encryptPassword } = require('../utils/password.js');

const STATUS_USER_PENDING_ACTIVATION = 3;

const getUsers = async (req, res= response) => {
    try {
        const [users] = await pool.query('SELECT * FROM users');
        if(!users) return res.status(404).json({msg: 'No se encontraron usuarios'});
        res.status(200).json({msg:'Ok', data:users});
    } catch (error) {
        res.status(500).json({msg: error.message});
    }
}

const addUser = async(req, res, next) => {
    const { first_name, last_name, email, phone_number, address, role_id, dc_id, customer_id = '' } = req.body;

    try {
        // Create a username with email
        const username = email.split('@')[0];

        // Create new password
        const temp_password = generateTempPassword(15);

        console.log(temp_password);

        const hash_password = encryptPassword(temp_password);

        const [result] = await pool.query('INSERT INTO users (username, first_name, last_name, email, phone_number, address, password, role_id, dc_id, customer_id, status_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [username, first_name, last_name, email, phone_number, address, hash_password, role_id, dc_id, customer_id, STATUS_USER_PENDING_ACTIVATION]);
    
        if (result.affectedRows === 0) {
            return res.status(500).json({ status: false, message: 'Error to create User. Please try again later.', data:[] });
        }

        res.status(201).json({status: true, message: 'User registered successfully', data: result.insertId });

    } catch (error) {
        next(error)
    }
}

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
    usuariosPatch,
    getUsers
}