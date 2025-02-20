const pool = require('../database/config');

const getCountries = async (req, res, next) => {
    try {
        const [rows] = await pool.query('SELECT id, country, iso FROM countries WHERE status = 1');
        res.status(200).json({status: true, message: 'Successfully', data: rows });
    } catch (error) {
        next(error);
    }
}

const getRoles = async (req, res, next) => {
    try {
        const [rows] = await pool.query('SELECT id, role_name FROM role_user WHERE status = 1');
        res.status(200).json({status: true, message: 'Successfully', data: rows });
    } catch (error) {
        next(error);
    }
}

const getTypeCase = async (req, res, next) => {
    try {
        const [rows] = await pool.query('SELECT id, type_name, is_pdf_file, url_pdf FROM type_case WHERE status = 1');
        res.status(200).json({status: true, message: 'Successfully', data: rows });
    } catch (error) {
        next(error);
    }
}

const getDCs = async (req, res, next) => {
    try {
        const [rows] = await pool.query('SELECT id, commun_name FROM dc WHERE status = 1');
        res.status(200).json({status: true, message: 'Successfully', data: rows });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getCountries,
    getRoles, getTypeCase, getDCs
}

