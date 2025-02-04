const pool = require('../database/config');

const addOrganization = async(req, res, next) => {
    const {name, commun_name, website, contact_phone, contact_address } = req.body;
    
    try {
        const [result] = await pool.query('INSERT INTO organization (name, commun_name, website, contact_phone, contact_address, created_at, updated_at, status) VALUES (?, ?, ?, ?, ?, NOW(), NOW(), 1)', [name, commun_name, website, contact_phone, contact_address])

        if (result.affectedRows === 0) {
            return res.status(500).json({ status: false, message: 'Error to create Organization. Please try again later.', data });
        }

        res.status(201).json({status: true, message: 'Organization registered successfully', data: result.insertId });
        
    } catch (error) {
        next(error)
    }
} 

const getAll = async(req, res, next) => {
    const {status=1} = req.query;

    try {
        const [rows] = await pool.query('SELECT idOrganization, name, commun_name, website, contact_phone, contact_address, created_at, updated_at, status  FROM vw_organizations WHERE status = ?', [status]);
        res.status(201).json({status: true, message: 'Successfully', data: rows });
    } catch (error) {
        next(error)
    }
}

const getById = async(req, res, next) => {
    const {id} = req.params;
    console.log(id);
    try {
        const [rows] = await pool.query('SELECT idOrganization, name, commun_name, website, contact_phone, contact_address, created_at, updated_at, status  FROM vw_organizations WHERE idOrganization = ?', [id]);
        res.status(201).json({status: true, message: 'Successfully', data: rows });
    } catch (error) {
        next(error)
    }
}

const deleteOrganization = async(req, res, next) => {
    const {id} = req.params;
    console.log(id);
    try {
        const [rows] = await pool.query('UPDATE organization SET status = 0 WHERE idOrganization = ?', [id]);
        res.status(201).json({status: true, message: 'Successfully', data: rows });
    } catch (error) {
        next(error)
    }
} 

const updateOrganization = async (req, res, next) => {
    const {id} = req.params;
    const {name, commun_name, website, contact_phone, contact_address } = req.body;

    try {
        const [result] = await pool.query('UPDATE organization SET name = ?, commun_name = ?, website = ?, contact_phone = ?, contact_address = ?, updated_at = NOW() WHERE idOrganization = ?', [name, commun_name, website, contact_phone, contact_address, id])
        console.log(result);
        if (result.affectedRows === 0) {
            return res.status(500).json({ status: false, message: 'Error to update Organization. Please try again later.', data });
        }

        res.status(201).json({status: true, message: 'Organization updated successfully', data: result });

    } catch (error) {
        next(error)
    }
}

const restoreOrganization = async (req, res, next) => {
    const {id} = req.params;

    try {
        const [result] = await pool.query('UPDATE organization SET status = 1 WHERE idOrganization = ?', [id])
        console.log(result);
        if (result.affectedRows === 0) {
            return res.status(500).json({ status: false, message: 'Error to restore Organization. Please try again later.', data });
        }

        res.status(201).json({status: true, message: 'Organization restored successfully', data: result });

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