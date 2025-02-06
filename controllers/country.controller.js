const pool = require('../database/config');

const getCountries = async (req, res, next) => {
    try {
        const [rows] = await pool.query('SELECT id, country, iso FROM countries WHERE status = 1');
        res.status(201).json({status: true, message: 'Successfully', data: rows });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getCountries
}

