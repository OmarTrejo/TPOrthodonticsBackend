const pool = require('../database/config');
const { formattedDate } = require('../utils/dates');
const { paginateQuery } = require('../utils/pagination');
// const { MODULES } = require('../utils/constants');
// const { systemLogs } = require('../utils/systemLogs');

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

    try
    {
        // Get user data
        const [applicant] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);

        // Validate if user email exists
        const [userExist] = await pool.query('SELECT * FROM users WHERE email = ?', [applicant[0].email]); 

        if(userExist.length > 0)
        {
            return res.status(400).json({ status: false, message: 'Email already exists', data: [] });
        }

        
        // Create user
        const [user] = await pool.query('INSERT INTO users (email, password, role_id, status) VALUES (?, ?, ?, ?)', [applicant[0].email, applicant[0].password, applicant[0].role_id, 1]);

        // const [result] = await pool.query('UPDATE dc SET name = ?, commun_name = ?, country_id = ?, state_province = ?, city = ?, address = ?, updated_at = NOW() WHERE id = ?', [name, commun_name, country_id, state, city, address, id])
        // if (result.affectedRows === 0) {
        //     return res.status(500).json({ status: false, message: 'Error to update Country/DC. Please try again later.', data:[]  });
        // }

        // systemLogs(user_id, "Row updated", id, MODULES.COUNTRIES);

        // res.status(201).json({status: true, message: 'Country/DC updated successfully', data: result });
    }catch(error)
    {
        next(error)
    }
}

module.exports = { getRequestsAccess, approvedRequests };