const pool = require('../database/config');

const addOrganization = async(req, res, next) => {
    const {name, commun_name, country_id, state, city, address } = req.body;
    
    try {
        const [result] = await pool.query('INSERT INTO organization (name, commun_name, country_id, state_province, city, address) VALUES (?, ?, ?, ?, ?, ?)', [name, commun_name, country_id, state, city, address])

        if (result.affectedRows === 0) {
            return res.status(500).json({ status: false, message: 'Error to create Country/DC. Please try again later.', data });
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
        res.status(201).json({status: true, message: 'Successfully', data: rows });
    } catch (error) {
        next(error)
    }
}

const getById = async(req, res, next) => {
    const {id} = req.params;
    console.log(id);
    try {
        const [rows] = await pool.query('SELECT id_organization, name, commun_name, country_id, state_province, city, address FROM organization WHERE id_organization = ?', [id]);
        res.status(201).json({status: true, message: 'Successfully', data: rows });
    } catch (error) {
        next(error)
    }
}

const deleteOrganization = async(req, res, next) => {
    const {id} = req.params;
    console.log(id);
    try {
        const [rows] = await pool.query('UPDATE organization SET status = 0 WHERE id_organization = ?', [id]);

        if (rows.affectedRows === 0) {
            return res.status(500).json({ status: false, message: 'Error to delete Country/DC. Please try again later.', data });
        }
        res.status(201).json({status: true, message: 'Country/DC deleted successfully', data: rows });
    } catch (error) {
        next(error)
    }
} 

const updateOrganization = async (req, res, next) => {
    const {id} = req.params;
    const {name, commun_name, country_id, state, city, address } = req.body;

    try {
        const [result] = await pool.query('UPDATE organization SET name = ?, commun_name = ?, country_id = ?, state_province = ?, city = ?, address = ?, updated_at = NOW() WHERE id_organization = ?', [name, commun_name, country_id, state, city, address, id])
        if (result.affectedRows === 0) {
            return res.status(500).json({ status: false, message: 'Error to update Country/DC. Please try again later.', data });
        }

        res.status(201).json({status: true, message: 'Country/DC updated successfully', data: result });

    } catch (error) {
        next(error)
    }
}

const restoreOrganization = async (req, res, next) => {
    const {id} = req.params;

    try {
        const [result] = await pool.query('UPDATE organization SET status = 1 WHERE id_organization = ?', [id])
        if (result.affectedRows === 0) {
            return res.status(500).json({ status: false, message: 'Error to restore Country/DC. Please try again later.', data });
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