const pool = require('../database/config');

const getCountries = async (req, res, next) => {

    const { page, pageSize, ...filters } = req.query;

    try {
        // * Conversión y validación
        const validatedPage = parseInt(page, 10) || 1;
        const validatedPageSize = parseInt(pageSize, 10) || 10;

        // * SQL Query base
        const baseQuery = "SELECT * FROM vw_users";
        const countQuery = "SELECT COUNT(*) AS total FROM vw_users";

        // Obtener datos paginados
        const paginatedData = await paginateQuery(baseQuery, countQuery, filters, validatedPage, validatedPageSize);

        // Formatear los resultados
        const filteredResponse = paginatedData.results.map((item) => {
            return {
                id: item.id,
                fullName: item.fullname,
                email: item.email,
                phoneNumber: item.phone_number,
                status: Boolean(item.is_enabled),
                isDeleted: Boolean(item.is_deleted),
                customerId: item.customer_id,
                activedMFA: Boolean(item.mfa_enabled),
                createdOn: formattedDate(item.created_at),
                updatedOn: formattedDate(item.updated_at),
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

    try {
        const [rows] = await pool.query('SELECT id, country, iso FROM countries WHERE status = 1');
        res.status(200).json({status: true, message: 'Successfully', data: rows });
    } catch (error) {
        next(error);
    }
}

const getRoles = async (req, res, next) => {
    try {
        const [rows] = await pool.query('SELECT id, role_name FROM role_user WHERE status = 1');
        res.status(200).json({status: true, message: 'Successfully', data: rows });
    } catch (error) {
        next(error);
    }
}

const getTypeCase = async (req, res, next) => {
    try {
        const [rows] = await pool.query('SELECT id, type_name, is_pdf_file, url_pdf FROM type_case WHERE status = 1');
        res.status(200).json({status: true, message: 'Successfully', data: rows });
    } catch (error) {
        next(error);
    }
}

const getDCs = async (req, res, next) => {
    try {
        const [rows] = await pool.query('SELECT id, commun_name FROM dc WHERE status = 1');
        res.status(200).json({status: true, message: 'Successfully', data: rows });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getCountries,
    getRoles, getTypeCase, getDCs
}

