const pool = require('../database/config');
const { MODULES } = require('../utils/constants');
const { systemLogs } = require('../utils/systemLogs');



const addOrganization = async(req, res, next) => {
    const {name, commun_name, country_id, state, city, address } = req.body;
    const user_id = req.user.id;

    try {
        const [result] = await pool.query('INSERT INTO dc (name, commun_name, country_id, state_province, city, address) VALUES (?, ?, ?, ?, ?, ?)', [name, commun_name, country_id, state, city, address])

        if (result.affectedRows === 0) {
            return res.status(500).json({ status: false, message: 'Error to create Country/DC. Please try again later.', data:[] });
        }

        // Save a logs
        systemLogs(user_id, "New row inserted", result.insertId, MODULES.COUNTRIES)

        res.status(201).json({status: true, message: 'Country/DC registered successfully', data: result.insertId });
        
    } catch (error) {
        next(error)
    }
} 

const getAll = async(req, res, next) => {
    const {status=1} = req.query;
    const user_id = req.user.id;

    try {
        const [rows] = await pool.query('SELECT * FROM vw_dcs WHERE status = ?', [status]);

        if (rows.length === 0) {
            return res.status(404).json({ status: false, message: "Country/DC's not found", data:[] });
        }

        res.status(200).json({status: true, message: 'Successfully', data: rows });
    } catch (error) {
        next(error)
    }
}

const getById = async(req, res, next) => {
    const {id} = req.params;
    try {
        const [rows] = await pool.query('SELECT id, name, commun_name, country_id, state_province, city, address FROM dc WHERE id = ?', [id]);

        if (rows.length === 0) {
            return res.status(404).json({ status: false, message: 'Country/DC not found', data:[] });
        }

        res.status(200).json({status: true, message: 'Successfully', data: rows });
    } catch (error) {
        next(error)
    }
}

const deleteOrganization = async(req, res, next) => {
    const {id} = req.params;
    const user_id = req.user.id;
    try {
        const [rows] = await pool.query('UPDATE dc SET status = 0 WHERE id = ?', [id]);

        if (rows.affectedRows === 0) {
            return res.status(500).json({ status: false, message: 'Error to delete Country/DC. Please try again later.', data:[] });
        }

        systemLogs(user_id, "Row deleted", id, MODULES.COUNTRIES);
        res.status(200).json({status: true, message: 'Country/DC deleted successfully', data: rows });
    } catch (error) {
        next(error)
    }
} 

const updateOrganization = async (req, res, next) => {
    const {id} = req.params;
    const {name, commun_name, country_id, state, city, address } = req.body;
    const user_id = req.user.id;
    try {
        const [result] = await pool.query('UPDATE dc SET name = ?, commun_name = ?, country_id = ?, state_province = ?, city = ?, address = ?, updated_at = NOW() WHERE id = ?', [name, commun_name, country_id, state, city, address, id])
        if (result.affectedRows === 0) {
            return res.status(500).json({ status: false, message: 'Error to update Country/DC. Please try again later.', data:[]  });
        }

        systemLogs(user_id, "Row updated", id, MODULES.COUNTRIES);

        res.status(201).json({status: true, message: 'Country/DC updated successfully', data: result });

    } catch (error) {
        next(error)
    }
}

const restoreOrganization = async (req, res, next) => {
    const {id} = req.params;
    const user_id = req.user.id;
    try {
        const [result] = await pool.query('UPDATE dc SET status = 1 WHERE id = ?', [id])
        if (result.affectedRows === 0) {
            return res.status(500).json({ status: false, message: 'Error to restore Country/DC. Please try again later.', data:[] });
        }

        systemLogs(user_id, "Row restored", id, MODULES.COUNTRIES);

        res.status(200).json({status: true, message: 'Country/DC restored successfully', data: result });

    } catch (error) {
        next(error)
    }

}

module.exports = {
    addOrganization,
    getAll,
    getById,
    deleteOrganization,
    updateOrganization,
    restoreOrganization
}