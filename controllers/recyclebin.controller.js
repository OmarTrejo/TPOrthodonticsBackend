const pool = require("../database/config.js");
const { paginateQuery } = require('../utils/pagination');
const { STATUS_USER, MODULES, TABLE_MAPPING } = require('../utils/constants.js');
const { formattedDate } = require("../utils/dates");

const getAllRecycleBin = async (req, res, next) => {
    const { page, pageSize, ...filters } = req.query;

    try {
        // * Conversión y validación
        const validatedPage = parseInt(page, 10) || 1;
        const validatedPageSize = parseInt(pageSize, 10) || 10;

        // * SQL Query base
        const baseQuery = "SELECT * FROM vw_recyclerbin";
        const countQuery = "SELECT COUNT(*) AS total FROM vw_recyclerbin";

        // Obtener datos paginados
        const paginatedData = await paginateQuery(baseQuery, countQuery, filters, validatedPage, validatedPageSize);

        // Formatear los resultados
        const filteredResponse = await Promise.all(paginatedData.results.map(async (item) => {

            const module = await getModule(item.module_id);
            const systemUser = await getUser(item.systemuser_id);
            const record = await getRecordByModule(item);

            return {
                id: item.id,
                deletedOn: formattedDate(item.deleted_at),                
                status: Boolean(item.status),
                module,
                systemUser,
                record
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

};

const getByIDRecycleBin = async (req, res, next) => {
    const { id } = req.params;

    try {
        const [recyclerbin] = await pool.query(`SELECT * FROM vw_recyclerbin WHERE id = ? LIMIT 1`, [id]);

        const response = {
            id: recyclerbin[0].id,
            deletedOn: formattedDate(recyclerbin[0].deleted_at),
            status: Boolean(recyclerbin[0].status),
            module: await getModule(recyclerbin[0].module_id),
            systemUser: await getUser(recyclerbin[0].systemuser_id),
            record: await getRecordByModule(recyclerbin[0])
        };

        res.status(200).json(response);
    } catch (error) {
        next(error)
    }
};

async function getRecordByModule(item) {

    const table = TABLE_MAPPING[item.module_id];

    if (!table) {
        throw new Error(`Módulo no válido: ${item.module_id}`);
    }

    try {
        const [record] = await pool.query(`SELECT * FROM ${table} WHERE id = ? LIMIT 1`, [item.record_id]);
        
        const response = {
            id: record[0].id,
            name: record[0].name != null ? record[0].name : record[0].fullname,
        };

        return response;
    } catch (error) {
        console.error(`Error al obtener el registro del módulo ${item.module_id}, ${item.record_id}: `, error);
        throw error; // Re-lanzar el error para que pueda ser manejado por el llamador
    }
}
async function getModule(module_id) {
    try {
        const [module] = await pool.query(`SELECT * FROM module WHERE id = ? LIMIT 1`, [module_id]);

        const response = {
            id: module[0].id,
            name: module[0].module,
        };

        return response;
    } catch (error) {
        console.error(`Error al obtener el registro del módulo ${module_id}: `, error);
        throw error; // Re-lanzar el error para que pueda ser manejado por el llamador
    }
}

async function getUser(user_id) {
    try {
        const [module] = await pool.query(`SELECT * FROM users WHERE id = ? LIMIT 1`, [user_id]);

        const response = {
            id: module[0].id,
            fullName: module[0].fullname,
            email: module[0].email,
        };

        return response;
    } catch (error) {
        console.error(`Error al obtener el registro del usuario ${user_id}: `, error);
        throw error; // Re-lanzar el error para que pueda ser manejado por el llamador
    }
}

module.exports = {
    getAllRecycleBin,
    getByIDRecycleBin
}