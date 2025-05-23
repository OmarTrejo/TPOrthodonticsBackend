const pool = require('../database/config');
const createError = require('../utils/createError');
const { ROLES_USER } = require('../utils/constants');

const getCountries = async (req, res, next) => {
    
    try {
        const [rows] = await pool.query('SELECT id, country, iso FROM countries WHERE status = 1');

        const filteredResponse = rows.map((item) => {
            return {
                id: item.id,
                name: item.country,
                iso: item.iso
            };
        })

        res.status(200).json(filteredResponse);
    } catch (error) {
        next(error);
    }
}

const getRoles = async (req, res, next) => {
    try {
        const [rows] = await pool.query('SELECT id, role_name FROM role_user WHERE status = 1');
        const filteredResponse = rows.map((item) => {
            return {
                id: item.id,
                name: item.role_name,
            };
        })

        res.status(200).json(filteredResponse);
    } catch (error) {
        next(error);
    }
}

const getTypeCase = async (req, res, next) => {
    try {
        const [rows] = await pool.query('SELECT id, type_name, is_pdf_file, url_pdf FROM type_case WHERE status = 1');
        const filteredResponse = rows.map((item) => {
            return {
                id: item.id,
                name: item.type_name,
                isPDFFile: Boolean(item.is_pdf_file),
                urlPDF: item.url_pdf
            };
        })

        res.status(200).json(filteredResponse);
    } catch (error) {
        next(error);
    }
}

const getDCs = async (req, res, next) => {
    try {
        const [rows] = await pool.query('SELECT id, country FROM countries WHERE status = 1');
        console.log(rows)
        const filteredResponse = rows.map((item) => {
            return {
                id: item.id,
                name: item.country,
                commonName: item.country
            };
        })
        res.status(200).json(filteredResponse);
    } catch (error) {
        next(error);
    }
}

const getCaseStatus = async (req, res, next) => {
    const id_user = req.user.id;
    try {
        const [user] = await pool.query('SELECT id, role_id FROM users WHERE id = ? LIMIT 1', [id_user]);
        let query = "";
        if (user[0].role_id == ROLES_USER.DOCTOR) {
            query = "SELECT id, status, span_color, general FROM status_case WHERE roleStatus = 1"
        }
        else {
            query = "SELECT id, status, span_color, general FROM status_case WHERE roleStatus = 0"
        }

        const [rows] = await pool.query(query);
        const filteredResponse = rows.map((item) => {
            return {
                id: item.id,
                name: item.status,
                color: item.span_color,
                general: Boolean(item.general)
            };
        })
        res.status(200).json(filteredResponse);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getCountries,
    getRoles, getTypeCase, getDCs,
    getCaseStatus
}

