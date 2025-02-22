const {response} = require('express');
const pool = require("../database/config.js");
const { generateTempPassword, encryptPassword } = require('../utils/password.js');
const { formattedDate } = require('../utils/dates.js');
const { STATUS_USER } = require('../utils/constants.js');
const { sendWelcomeEmail } = require('../utils/email.js');

const getUsers = async (req, res= response) => {
    try {
        const [users] = await pool.query('SELECT * FROM users');
        if(!users) return res.status(404).json({msg: 'No se encontraron usuarios'});

        const formattedUsers = users.map(user => ({
            ...user,
            created_at: formattedDate(user.created_at),
            updated_at: formattedDate(user.updated_at)
        }));

        res.status(200).json({msg:'Ok', data:formattedUsers});
    } catch (error) {
        res.status(500).json({msg: error.message});
    }
}

const addUser = async(req, res, next) => {
    const { fullname, email, phone_number, address, role_id, dc_id, customer_id = '' } = req.body;

    try {
        // Create a username with email
        const username = email.split('@')[0];

        // Create new password
        const temp_password = generateTempPassword(15);

        // CREATE A HASH PASSWORD
        const hash_password = encryptPassword(temp_password);

        // INSERT INTO DB
        const [result] = await pool.query('INSERT INTO users (username, fullname, email, phone_number, address, password, role_id, dc_id, customer_id, status_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [username, fullname, email, phone_number, address, hash_password, role_id, dc_id, customer_id, STATUS_USER.PENDING_ACTIVATION]);
    
        // VALIDATE THAT THE USER WAS CREATED
        if (result.affectedRows === 0) {
            return res.status(500).json({ status: false, message: 'Error to create User. Please try again later.', data:[] });
        }

        // SEND A EMAIL WITH PASSWORD 
        sendWelcomeEmail(email, fullname, temp_password);

        res.status(201).json({status: true, message: 'User registered successfully', data: result.insertId });

    } catch (error) {
        next(error)
    }
}



module.exports = {
    getUsers,
    addUser
}