const pool = require('../database/config');

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
        const [rows] = await pool.query('SELECT id, name, commun_name FROM dc WHERE status = 1');
        const filteredResponse = rows.map((item) => {
            return {
                id: item.id,
                name: item.name,
                commonName: item.commun_name
            };
        })
        res.status(200).json(filteredResponse);
    } catch (error) {
        next(error);
    }
}

const getCaseStatus = async (req, res, next) => {
    try {
        const [rows] = await pool.query('SELECT id, status, span_color, general FROM status_case');
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

