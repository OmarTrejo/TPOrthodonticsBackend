const pool = require('../database/config');

const addOrganization = async(req, res, next) => {
    const {name, commun_name, country_id, state, city, address } = req.body;
    const user_id = req.user.id;

    try {
        const [result] = await pool.query('INSERT INTO organization (name, commun_name, country_id, state_province, city, address, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [name, commun_name, country_id, state, city, address, user_id, user_id])

        if (result.affectedRows === 0) {
            return res.status(500).json({ status: false, message: 'Error to create Country/DC. Please try again later.', data:[] });
        }

        res.status(201).json({status: true, message: 'Country/DC registered successfully', data: result.insertId });
        
    } catch (error) {
        next(error)
    }
} 

const getAll = async(req, res, next) => {
    const {status=1} = req.query;

    try {
        const [rows] = await pool.query('SELECT * FROM vw_organizations WHERE status = ?', [status]);

        if (rows.length === 0) {
            return res.status(404).json({ status: false, message: "Country/DC's not found", data:[] });
        }

        res.status(201).json({status: true, message: 'Successfully', data: rows });
    } catch (error) {
        next(error)
    }
}

const getById = async(req, res, next) => {
    const {id} = req.params;
    try {
        const [rows] = await pool.query('SELECT id_organization, name, commun_name, country_id, state_province, city, address FROM organization WHERE id_organization = ?', [id]);

        if (rows.length === 0) {
            return res.status(404).json({ status: false, message: 'Country/DC not found', data:[] });
        }

        res.status(201).json({status: true, message: 'Successfully', data: rows });
    } catch (error) {
        next(error)
    }
}

const deleteOrganization = async(req, res, next) => {
    const {id} = req.params;
    const user_id = req.user.id;
    try {
        const [rows] = await pool.query('UPDATE organization SET status = 0, updated_by = ? WHERE id_organization = ?', [user_id, id]);

        if (rows.affectedRows === 0) {
            return res.status(500).json({ status: false, message: 'Error to delete Country/DC. Please try again later.', data:[] });
        }
        res.status(201).json({status: true, message: 'Country/DC deleted successfully', data: rows });
    } catch (error) {
        next(error)
    }
} 

const updateOrganization = async (req, res, next) => {
    const {id} = req.params;
    const {name, commun_name, country_id, state, city, address } = req.body;
    const user_id = req.user.id;
    try {
        const [result] = await pool.query('UPDATE organization SET name = ?, commun_name = ?, country_id = ?, state_province = ?, city = ?, address = ?, updated_at = NOW(), updated_by = ? WHERE id_organization = ?', [name, commun_name, country_id, state, city, address, user_id, id])
        if (result.affectedRows === 0) {
            return res.status(500).json({ status: false, message: 'Error to update Country/DC. Please try again later.', data:[]  });
        }

        res.status(201).json({status: true, message: 'Country/DC updated successfully', data: result });

    } catch (error) {
        next(error)
    }
}

const restoreOrganization = async (req, res, next) => {
    const {id} = req.params;
    const user_id = req.user.id;
    try {
        const [result] = await pool.query('UPDATE organization SET status = 1, updated_by = ? WHERE id_organization = ?', [user_id ,id])
        if (result.affectedRows === 0) {
            return res.status(500).json({ status: false, message: 'Error to restore Country/DC. Please try again later.', data:[] });
        }

        res.status(201).json({status: true, message: 'Country/DC restored successfully', data: result });

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