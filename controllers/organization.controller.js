const pool = require('../database/config');
const { MODULES } = require('../utils/constants');
const { systemLogs } = require('../utils/systemLogs');
const { paginateQuery } = require('../utils/pagination');


const addOrganization = async (req, res, next) => {
    const { name, commonName, countryId, state, city, address } = req.body;
    // const user_id = req.user.id;

    try {
        const [result] = await pool.query('INSERT INTO dc (name, commun_name, country_id, state_province, city, address) VALUES (?, ?, ?, ?, ?, ?)', [name, commonName, countryId, state, city, address])

        if (result.affectedRows === 0) {
            return res.status(500).json({ status: false, message: 'Error to create Country/DC. Please try again later.', data: [] });
        }

        // Save a logs
        // systemLogs(user_id, "New row inserted", result.insertId, MODULES.COUNTRIES)

        res.status(201).json({ status: true, message: 'Country/DC registered successfully', data: result.insertId });

    } catch (error) {
        next(error)
    }
}

const getAll = async (req, res, next) => {
    const { page, pageSize, ...filters } = req.query;

    try {
        // * Conversión y validación
        const validatedPage = parseInt(page, 10) || 1;
        const validatedPageSize = parseInt(pageSize, 10) || 10;

        // * SQL Query base
        const baseQuery = "SELECT * FROM vw_dcs";
        const countQuery = "SELECT COUNT(*) AS total FROM vw_dcs";

        // Obtener datos paginados
        const paginatedData = await paginateQuery(baseQuery, countQuery, filters, validatedPage, validatedPageSize);

        // Formatear los resultados
        const filteredResponse = paginatedData.results.map((item) => {
            return {
                id: item.id,
                name: item.name,
                commonName: item.commun_name,
                country: item.country,
                state: item.state_province,
                city: item.city,
                address: item.address,
                status: Boolean(item.status)
            };
        });

        // Construir la respuesta
        const response = {
            ...paginatedData,
            results: filteredResponse,
        };

        res.status(200).json(response);
    } catch (error) {
        next(error)
    }
}

const getById = async (req, res, next) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query('SELECT id, name, commun_name, country_id, state_province, city, address FROM dc WHERE id = ?', [id]);

        if (rows.length === 0) {
            return res.status(404).json({ status: false, message: 'Country/DC not found', data: [] });
        }

        res.status(200).json({ status: true, message: 'Successfully', data: rows });
    } catch (error) {
        next(error)
    }
}

const deleteOrganization = async (req, res, next) => {
    const { id } = req.params;
    const user_id = req.user.id;
    try {
        const [rows] = await pool.query('UPDATE dc SET status = 0 WHERE id = ?', [id]);

        if (rows.affectedRows === 0) {
            return res.status(500).json({ status: false, message: 'Error to delete Country/DC. Please try again later.', data: [] });
        }

        systemLogs(user_id, "Row deleted", id, MODULES.COUNTRIES);
        res.status(200).json({ status: true, message: 'Country/DC deleted successfully', data: rows });
    } catch (error) {
        next(error)
    }
}

const updateOrganization = async (req, res, next) => {
    const { id } = req.params;
    const { name, commun_name, country_id, state, city, address } = req.body;
    const user_id = req.user.id;
    try {
        const [result] = await pool.query('UPDATE dc SET name = ?, commun_name = ?, country_id = ?, state_province = ?, city = ?, address = ?, updated_at = NOW() WHERE id = ?', [name, commun_name, country_id, state, city, address, id])
        if (result.affectedRows === 0) {
            return res.status(500).json({ status: false, message: 'Error to update Country/DC. Please try again later.', data: [] });
        }

        systemLogs(user_id, "Row updated", id, MODULES.COUNTRIES);

        res.status(201).json({ status: true, message: 'Country/DC updated successfully', data: result });

    } catch (error) {
        next(error)
    }
}

const restoreOrganization = async (req, res, next) => {
    const { id } = req.params;
    const user_id = req.user.id;
    try {
        const [result] = await pool.query('UPDATE dc SET status = 1 WHERE id = ?', [id])
        if (result.affectedRows === 0) {
            return res.status(500).json({ status: false, message: 'Error to restore Country/DC. Please try again later.', data: [] });
        }

        systemLogs(user_id, "Row restored", id, MODULES.COUNTRIES);

        res.status(200).json({ status: true, message: 'Country/DC restored successfully', data: result });

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