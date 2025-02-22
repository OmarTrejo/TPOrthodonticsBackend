const pool = require('../database/config');
const { formattedDate } = require('../utils/dates');
const { paginateQuery } = require('../utils/pagination');
// const { MODULES } = require('../utils/constants');
// const { systemLogs } = require('../utils/systemLogs');
import * as next from 'next';
import * as res from 'express/lib/response';

// * Get all requests access
const getRequestsAccess = async (req, res, next) => {

    const { page, pageSize } = req.query;

    try {
        // Conversión y validación
        const validatedPage = parseInt(page, 10) || 1;
        const validatedPageSize = parseInt(pageSize, 10) || 10;

        // * SQL Query base
        const baseQuery = "SELECT * FROM vw_requests_access";
        const countQuery = "SELECT COUNT(*) AS total FROM vw_requests_access";

        // Obtener datos paginados
        const paginatedData = await paginateQuery(baseQuery, countQuery, [], validatedPage, validatedPageSize);

        // Formatear los resultados
        const filteredResponse = paginatedData.results.map((item) => {
            return {
                id: item.id,
                fullName: item.fullname,
                email: item.email,
                createdOn: formattedDate(item.created_at),
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
};


// * Approved the requests access
const approvedRequests = async( req, res, next) => {
    const { id } = req.params;

    try {
        // * SQL Query
        const [rows] = await pool.query('CALL sp_approved_request_access(?)', [id]);

        // * Response
        res.status(200).json(rows[0][0]);
    } catch (error) {
        next(error)
    }
}

module.exports = { getRequestsAccess };