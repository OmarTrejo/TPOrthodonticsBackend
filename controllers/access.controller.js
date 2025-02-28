const pool = require('../database/config');
const { MODULES, ROLES_USER, STATUS_USER } = require('../utils/constants');
const { formattedDate } = require('../utils/dates');
const { sendAccessRequestDenyEmail, sendAccessRequestApprovedEmail } = require('../utils/email');
const { paginateQuery } = require('../utils/pagination');
const { systemLogs } = require('../utils/systemLogs');
const createError = require('../utils/createError');
const { insertNotification } = require('../utils/addConfNotifications');
// const { MODULES } = require('../utils/constants');
// const { systemLogs } = require('../utils/systemLogs');

// * Get all requests access
const getRequestsAccess = async (req, res, next) => {

    const { page, pageSize, ...filters } = req.query;

    try {
        // Conversión y validación
        const validatedPage = parseInt(page, 10) || 1;
        const validatedPageSize = parseInt(pageSize, 10) || 10;

        // * SQL Query base
        const baseQuery = "SELECT * FROM vw_requests_access";
        const countQuery = "SELECT COUNT(*) AS total FROM vw_requests_access";

        // Obtener datos paginados
        const paginatedData = await paginateQuery(baseQuery, countQuery, filters, validatedPage, validatedPageSize);

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
    const user_id = req.user.id;

    try
    {
        // Get user data
        const [applicant] = await pool.query('SELECT * FROM request_user WHERE id = ? LIMIT 1', [id]);
        // Get new user data
        const new_user = applicant[0];

        // Validate if user email exists
        const [userExist] = await pool.query('SELECT * FROM users WHERE email = ?', [new_user.email]); 

        if(userExist.length > 0)
        {
            const error = createError(
                "User and email already exists", // Mensaje de error
                ["The email is used for another user of system"], // Detalles
                req.traceId, // TraceId (si lo tienes)
                req.originalUrl // URL de la solicitud
            );
            return next(error); // Pasa el error al middleware de manejo de errores
        }
        
        const username = new_user.email.split('@')[0];
        
        // Create user
        const [user] = await pool.query('INSERT INTO users (username, email, password, fullname, role_id, status_id) VALUES (?, ?, ?, ?, ?, ?)', [username, new_user.email, new_user.password, new_user.fullname, ROLES_USER.DOCTOR, STATUS_USER.ACTIVE]);

        // Save logs
        systemLogs(user_id, "Requests access has been approved", user.insertId, MODULES.REQUESTS);

        // Create notifications data
        insertNotification(user.insertId);
        
        // * Update your requests
        await pool.query('UPDATE request_user SET status = 0 WHERE id = ?', [id]);

        // Create conf notifications
        await pool.query('INSERT INTO conf_notification (user_id, email_enabled, sms_enabled, whatsapp, new_case, new_comment, new_assignment, new_access_request) VALUES (?, 0, 0, 0, 0, 0, 0, 0 )', [user.insertId])

        // Send email with new password
        sendAccessRequestApprovedEmail(new_user.email, new_user.fullname);

        res.status(201).json({message: 'Request access has been approved succesfully'});
    }catch(error)
    {
        next(error)
    }
}

/**
 * TODO Deny access to platform
 * Send email to user with a link to create a new password
 */
const denyAccess = async(req, res, next) => {
    const { id } = req.params;
    const user_id = req.user.id;

    try
    {
        // * Get data from user
        const [ applicant ] = await pool.query('SELECT * FROM request_user WHERE id = ?', [id]);
        // * Update your requests
        await pool.query('UPDATE request_user SET status = 0 WHERE id = ?', [id]);
        // * Se elimina la solicitud, y envía un correo que fue denegado su acceso
        sendAccessRequestDenyEmail(applicant[0].email, applicant[0].fullname);

        systemLogs(user_id, "Request Access has been denied", id, MODULES.REQUESTS);

        res.status(204).json();
    }catch(error)
    {
        next(error)
    }
}

module.exports = { getRequestsAccess, approvedRequests, denyAccess };