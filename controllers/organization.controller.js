const pool = require('../database/config');
const { MODULES } = require('../utils/constants');
const { systemLogs } = require('../utils/systemLogs');
const { paginateQuery } = require('../utils/pagination');
const createError = require('../utils/createError');
const { recyclerBin } = require('../utils/recyclerbin');


const addOrganization = async (req, res, next) => {
    const { name, commonName, countryId, state, city, address } = req.body;
    const user_id = req.user.id;

    try {
        const [result] = await pool.query('INSERT INTO dc (name, commun_name, country_id, state_province, city, address) VALUES (?, ?, ?, ?, ?, ?)', [name, commonName, countryId, state, city, address])

        if (result.affectedRows === 0) {
            const error = createError(
                "Error, please try again later", // Mensaje de error
                ["Error connection to database"], // Detalles
                req.traceId, // TraceId (si lo tienes)
                req.originalUrl // URL de la solicitud
            );
            return next(error); // Pasa el error al middleware de manejo de errores
        }

        // Save a logs
        systemLogs(user_id, "New row inserted", result.insertId, MODULES.COUNTRIES)

        res.status(201).json({message: 'Country/DC registered successfully'});

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
        const baseQuery = "SELECT * FROM countries";
        const countQuery = "SELECT COUNT(*) AS total FROM countries";

        if (filters.name) {
            filters.country = filters.name;
            delete filters.name;
        }

        // Obtener datos paginados
        const paginatedData = await paginateQuery(baseQuery, countQuery, filters, validatedPage, validatedPageSize);

        // Formatear los resultados
        const filteredResponse = await Promise.all(paginatedData.results.map(async (item) => {

           return {
                id: item.id,
                name: item.country,
                commonName: item.country,
                status: Boolean(item.status)
            };
        })
    );

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
        const [rows] = await pool.query('SELECT id, name, commun_name, country_id, state_province, city, address, status FROM dc WHERE id = ?', [id]);

        if (rows.length === 0) {
            const error = createError(
                "Country DC not found", // Mensaje de error
                ["Id incorrect"], // Detalles
                req.traceId, // TraceId (si lo tienes)
                req.originalUrl // URL de la solicitud
            );
            return next(error); // Pasa el error al middleware de manejo de errores
        }

        const [country] = await pool.query('SELECT country, iso, status FROM countries WHERE id = ? LIMIT 1', [rows[0].country_id]);

        // *Filtered response
        const response = {
            id: rows[0].id,
            name: rows[0].name,
            commonName: rows[0].commun_name,
            state: rows[0].state_province,
            city: rows[0].city,
            address: rows[0].address,
            status: Boolean(rows[0].status),
            country: {
                id: rows[0].country_id,
                name: country[0].country,
                iso: country[0].iso,
            }
        };
     
        // * Send response
        res.status(200).json(response);
    } catch (error) {
        next(error)
    }
}

const deleteOrganization = async (req, res, next) => {
    const { id } = req.params;
    const user_id = req.user.id;

    try {
        const [rows] = await pool.query('UPDATE dc SET is_deleted = 1 WHERE id = ?', [id]);

        if (rows.affectedRows === 0) {
            const error = createError(
                "Error to delete Country, please try again later", // Mensaje de error
                ["Error into database"], // Detalles
                req.traceId, // TraceId (si lo tienes)
                req.originalUrl // URL de la solicitud
            );
            return next(error); // Pasa el error al middleware de manejo de errores
        }

        // Logs inserts
        systemLogs(user_id, "Row deleted", id, MODULES.COUNTRIES);
        // Create a record
        recyclerBin(id, MODULES.COUNTRIES, user_id);

        res.status(204).json({ message: 'Country/DC deleted successfully' });
    } catch (error) {
        next(error)
    }
}


// UPDATE STATUS
const updateStatusOrganization = async (req, res, next) => {
    const { id, } = req.params;
    const { status } = req.body;
    const user_id = req.user.id;

    try {
        const [rows] = await pool.query('UPDATE dc SET status = ? WHERE id = ?', [status, id]);

        if (rows.affectedRows === 0) {
            const error = createError(
                "Error to change status of Country, please try again later", // Mensaje de error
                ["Error into database"], // Detalles
                req.traceId, // TraceId (si lo tienes)
                req.originalUrl // URL de la solicitud
            );
            return next(error); // Pasa el error al middleware de manejo de errores
        }

        // Logs inserts
        systemLogs(user_id, "Row updated status", id, MODULES.COUNTRIES);
        res.status(201).json({ message: 'Country/DC changed status successfully'});
    } catch (error) {
        next(error)
    }
}

const updateOrganization = async (req, res, next) => {
    const { id } = req.params;
    const { name, commonName, countryId, state, city, address } = req.body;
    const user_id = req.user.id;
    try {
        const [result] = await pool.query('UPDATE dc SET name = ?, commun_name = ?, country_id = ?, state_province = ?, city = ?, address = ?, updated_at = NOW() WHERE id = ?', [name, commonName, countryId, state, city, address, id])
        if (result.affectedRows === 0) {
            const error = createError(
                "Error to update Country, please try again later", // Mensaje de error
                ["Error when update row"], // Detalles
                req.traceId, // TraceId (si lo tienes)
                req.originalUrl // URL de la solicitud
            );
            return next(error); // Pasa el error al middleware de manejo de errores
        }

        systemLogs(user_id, "Row updated", id, MODULES.COUNTRIES);

        res.status(200).json({ message: 'Country/DC updated successfully'});

    } catch (error) {
        next(error)
    }
}

const restoreOrganization = async (req, res, next) => {
    const { id } = req.params;
    const user_id = req.user.id;
    try {
        const [result] = await pool.query('UPDATE dc SET is_deleted = 0 WHERE id = ?', [id])
        if (result.affectedRows === 0) {
            return res.status(500).json({ status: false, message: 'Error to restore Country/DC. Please try again later.', data: [] });
        }

        systemLogs(user_id, "Row restored", id, MODULES.COUNTRIES);

        res.status(200).json({ status: true, message: 'Country/DC restored successfully', data: result });

    } catch (error) {
        next(error)
    }

}

const deletedMany = async (req, res, next) => {
    const { ids } = req.body;
    const user_id = req.user.id;

    try {
        const placeholders = ids.map(() => '?').join(', ');
        const [result] = await pool.query(`UPDATE dc SET is_deleted = 1 WHERE id IN (${placeholders})`, ids);

        if (result.affectedRows === 0) {
            const error = createError(
                "Error to delete Countries, please try again later", // Mensaje de error
                ["Error into database"], // Detalles
                req.traceId, // TraceId (si lo tienes)
                req.originalUrl // URL de la solicitud
            );
            return next(error); // Pasa el error al middleware de manejo de errores
        }

        // Logs inserts
        ids.forEach(id => {
            systemLogs(user_id, "Row deleted", id, MODULES.COUNTRIES);
        });

        res.status(204).json({ message: 'Countries/DC deleted successfully' });
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
    restoreOrganization,
    updateStatusOrganization,
    deletedMany
}