const { formattedDate } = require("../utils/dates");
const { paginateQuery } = require('../utils/pagination');
const createError = require('../utils/createError');
const pool = require('../database/config');

const getAllByUser = async(req, res, next) => {
    const user_id = req.user.id;
    const { page, pageSize, ...filters } = req.query;

    try {
        // * Conversión y validación
        const validatedPage = parseInt(page, 10) || 1;
        const validatedPageSize = parseInt(pageSize, 10) || 10;

        // * SQL Query base
        const baseQuery = "SELECT * FROM vw_notifications";
        const countQuery = "SELECT COUNT(*) AS total FROM vw_notifications";

        const orderBy = {
            column: 'createdOn', 
            direction: 'DESC'
        }

        // Obtener datos paginados
        const paginatedData = await paginateQuery(baseQuery, countQuery, { ...filters, receiverId: user_id }, validatedPage, validatedPageSize, orderBy);

        // Formatear los resultados
        const filteredResponse = await Promise.all(paginatedData.results.map(async (item) => {
            // Get caseStatus
            const [transmitter] = await pool.query('SELECT fullname, photo FROM users WHERE id = ? LIMIT 1', [item.transmitterId]);

            return {
                id: item.id,
                title: item.title,
                message: item.message,
                createdOn: formattedDate(item.createdOn),
                redirectUrl: item.redirectUrl,
                transmitter: {
                    fullName: transmitter[0].fullname,
                    avatarUrl: transmitter[0].photo
                }
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

const updateSeen = async (req, res, next) => {
    const { id } = req.params;

    try {
        const [result] = await pool.query('UPDATE notifications SET seen = 1 WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return next(createError("Error, please try again later", ["Database connection error"], req.traceId, req.originalUrl));
        }

        res.status(200).json({ message: "Notification updated successfully" });
    } catch (error) {
        next(error)
    }
}

module.exports = {
    getAllByUser,
    updateSeen
}