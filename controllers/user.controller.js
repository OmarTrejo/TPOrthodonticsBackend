const { response } = require('express');
const pool = require("../database/config.js");
const { generateTempPassword, encryptPassword } = require('../utils/password.js');
const { formattedDate } = require('../utils/dates.js');
const { STATUS_USER, MODULES, TABLE_MAPPING } = require('../utils/constants.js');
const { sendWelcomeEmail } = require('../utils/email.js');
const { paginateQuery } = require('../utils/pagination');
const { systemLogs } = require('../utils/systemLogs.js');
const createError = require('../utils/createError');
const { recyclerBin } = require('../utils/recyclerbin.js');
const { insertNotification } = require('../utils/addConfNotifications');

// * Add new user
const addUser = async (req, res, next) => {
    const { fullName, email, phoneNumber, roleId, organizationId, customerId = '' } = req.body;
    const user_id = req.user.id;

    try {
        // Create a username with email
        const username = email.split('@')[0];

        // Create new password
        const temp_password = generateTempPassword(15);

        // CREATE A HASH PASSWORD
        const hash_password = encryptPassword(temp_password);

        // Generate a token with 8 numbers
        const token = Math.floor(10000000 + Math.random() * 90000000).toString();

        // INSERT INTO DB
        const [result] = await pool.query('INSERT INTO users (username, fullname, email, phone_number, password, role_id, dc_id, customer_id, status_id, recovery_password, token_verification) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)', [username, fullName, email, phoneNumber, hash_password, roleId, organizationId, customerId, STATUS_USER.PENDING_ACTIVATION, token]);

        // VALIDATE THAT THE USER WAS CREATED
        if (result.affectedRows === 0) {
            const error = createError(
                "Error to create user, please try again later", // Mensaje de error
                ["Error to register"], // Detalles
                req.traceId, // TraceId (si lo tienes)
                req.originalUrl // URL de la solicitud
            );
            return next(error); // Pasa el error al middleware de manejo de errores
        }

        // Save a logs
        systemLogs(user_id, "New row inserted", result.insertId, MODULES.USERS)

        // SEND A EMAIL WITH PASSWORD 
        sendWelcomeEmail(email, fullName, temp_password, token);

        // Insert notification
        insertNotification(result.insertId);

        res.status(201).json({ message: 'User registered successfully' });

    } catch (error) {
        next(error)
    }
}

// * Get all users
const getUsers = async (req, res, next) => {
    const { page, pageSize, ...filters } = req.query;
    const user_id = req.user.id;
    try {
        // * Conversión y validación
        const validatedPage = parseInt(page, 10) || 1;
        const validatedPageSize = parseInt(pageSize, 10) || 10;

        // * SQL Query base
        const baseQuery = "SELECT * FROM vw_users";
        const countQuery = "SELECT COUNT(*) AS total FROM vw_users";

        // Obtener datos paginados
        const paginatedData = await paginateQuery(baseQuery, countQuery, {...filters, userId:user_id}, validatedPage, validatedPageSize);

        // Formatear los resultados
        const filteredResponse = await Promise.all(paginatedData.results.map(async (item) => {
            const role = await getRole(item.role_id);
            const country = await getCountry(item.dc_id);

            return {
                id: item.userId,
                fullName: item.fullname,
                email: item.email,
                phoneNumber: item.phone_number,
                status: Boolean(item.is_enabled),
                statusName: item.status,
                isDeleted: Boolean(item.is_deleted),
                customerId: item.customer_id,
                activedMFA: Boolean(item.mfa_enabled),
                createdOn: formattedDate(item.created_at),
                updatedOn: formattedDate(item.updated_at),
                role,
                organization: country
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

// * Get user by Id
const getUserById = async (req, res, next) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query('SELECT * FROM vw_users WHERE id = ?', [id]);

        if (rows.length === 0) {
            const error = createError(
                "User not found", // Mensaje de error
                ["Id incorrect"], // Detalles
                req.traceId, // TraceId (si lo tienes)
                req.originalUrl // URL de la solicitud
            );
            return next(error); // Pasa el error al middleware de manejo de errores
        }

        const role = await getRole(rows[0].role_id);
        const country = await getCountry(rows[0].dc_id);
        const response = {
            id: rows[0].userId,
            fullName: rows[0].fullname,
            email: rows[0].email,
            phoneNumber: rows[0].phone_number,
            status: Boolean(rows[0].is_enabled),
            isDeleted: Boolean(rows[0].is_deleted),
            customerId: rows[0].customer_id,
            activedMFA: Boolean(rows[0].mfa_enabled),
            createdOn: formattedDate(rows[0].created_at),
            updatedOn: formattedDate(rows[0].updated_at),
            role,
            organization: country
        };

        res.status(200).json(response);
    } catch (error) {
        next(error)
    }
}

// * Update users
// * @param  
const updateUser = async (req, res, next) => {
    const { id } = req.params;
    const { fullName, email, phoneNumber, roleId, organizationId, customerId = '', status } = req.body;
    const user_id = req.user.id;

    const new_status = status === true ? STATUS_USER.ACTIVE : STATUS_USER.INACTIVE;

    try {
        const [rows] = await pool.query('UPDATE users SET fullname = ?, phone_number = ?, customer_id = ?, email = ?, role_id = ?, dc_id = ?, status_id = ? WHERE id = ?', [fullName, phoneNumber, customerId, email, roleId, organizationId, new_status, id]);

        if (rows.affectedRows === 0) {
            const error = createError(
                "Error to change status of User, please try again later", // Mensaje de error
                ["Error into database"], // Detalles
                req.traceId, // TraceId (si lo tienes)
                req.originalUrl // URL de la solicitud
            );
            return next(error); // Pasa el error al middleware de manejo de errores
        }

        // Logs inserts
        systemLogs(user_id, "Row updated status", id, MODULES.USERS);
        res.status(200).json({ message: 'User changed status successfully' });
    } catch (error) {
        next(error);
    }
}

// * Update users
// * @param  
const updateStatus = async (req, res, next) => {
    const { id } = req.params;
    const user_id = req.user.id;
    const { status } = req.body;

    const new_status = status === true ? STATUS_USER.ACTIVE : STATUS_USER.INACTIVE;

    try {

        const [current_user] = await pool.query('SELECT * FROM users WHERE id = ?', [id])

        if (current_user[0].status_id === STATUS_USER.PENDING_ACTIVATION) {
            const error = createError(
                "Error to change status of User, user have pending activation", // Mensaje de error
                ["Error into database"], // Detalles
                req.traceId, // TraceId (si lo tienes)
                req.originalUrl // URL de la solicitud
            );
            return next(error); // Pasa el error al middleware de manejo de errores
        }

        const [rows] = await pool.query('UPDATE users SET status_id = ? WHERE id = ?', [new_status, id]);

        if (rows.affectedRows === 0) {
            const error = createError(
                "Error to change status of User, please try again later", // Mensaje de error
                ["Error into database"], // Detalles
                req.traceId, // TraceId (si lo tienes)
                req.originalUrl // URL de la solicitud
            );
            return next(error); // Pasa el error al middleware de manejo de errores
        }

        // Logs inserts
        systemLogs(user_id, "Row status updated status", id, MODULES.USERS);
        res.status(200).json({ message: 'User changed status successfully' });
    } catch (error) {
        next(error);
    }
}

// * Update users
// * @param  
const deleteUser = async (req, res, next) => {
    const { id } = req.params;
    const user_id = req.user.id;

    try {
        const [rows] = await pool.query('UPDATE users SET is_deleted = 1, status_id = ? WHERE id = ?', [STATUS_USER.DELETED, id]);

        if (rows.affectedRows === 0) {
            const error = createError(
                "Error to change status of User, please try again later", // Mensaje de error
                ["Error into database"], // Detalles
                req.traceId, // TraceId (si lo tienes)
                req.originalUrl // URL de la solicitud
            );
            return next(error); // Pasa el error al middleware de manejo de errores
        }

        // Logs inserts
        systemLogs(user_id, "Row status deleted status", id, MODULES.USERS);
        // ! CREATE A RECYCLER
        recyclerBin(id, MODULES.USERS, user_id);

        res.status(204).json({ message: 'User changed status successfully' });
    } catch (error) {
        next(error);
    }
}

const getLogs = async (req, res, next) => {
    const { page, pageSize, ...filters } = req.query;

    try {
        // * Conversión y validación
        const validatedPage = parseInt(page, 10) || 1;
        const validatedPageSize = parseInt(pageSize, 10) || 10;

        // * SQL Query base
        const baseQuery = "SELECT * FROM vw_logs";
        const countQuery = "SELECT COUNT(*) AS total FROM vw_logs";

        // Add order by to the filters
        const orderBy = { column: 'created_at', direction: 'DESC' };

        // Obtener datos paginados
        const paginatedData = await paginateQuery(baseQuery, countQuery, filters, validatedPage, validatedPageSize, orderBy);

        // Formatear los resultados y obtener registros adicionales por módulo
        const filteredResponse = await Promise.all(
            paginatedData.results.map(async (item) => {
                try {
                    // Obtener el registro adicional según el módulo
                    const record = await getRecordByModule(item);
                    const module = await getModule(item.module_id);
                    const systemUser = await getUser(item.user_id);

                    return {
                        id: item.id,
                        createdOn: formattedDate(item.created_at),
                        record: record, // Incluir el registro obtenido
                        module,
                        action: item.action, // Incluir el registro obtenido,
                        systemUser

                    };
                } catch (error) {
                    console.error(`Error procesando el item con id ${item.id}:`, error);
                    return {
                        id: item.id,
                        error: true, // Indicar que hubo un error
                        message: error.message, // Opcional: incluir el mensaje de error
                    };
                }
            })
        );

        // Construir la respuesta
        const response = {
            ...paginatedData,
            results: filteredResponse,
        };

        res.status(200).json(response);
    }
    catch (error) {
        next(error)
    }
}

async function getRecordByModule(item) {

    const table = TABLE_MAPPING[item.module_id];

    if (!table) {
        throw new Error(`Módulo no válido: ${item.module_id}`);
    }

    try {
        const [record] = await pool.query(`SELECT * FROM ${table} WHERE id = ? LIMIT 1`, [item.modified_id]);

        const response = {
            id: record[0].id,
            name: record[0].name != null ? record[0].name : record[0].fullname,
        };

        return response;
    } catch (error) {
        console.error(`Error al obtener el registro del módulo ${item.module_id}, ${item.modified_id}: `, error);
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
        console.error(`Error al obtener el registro del módulo ${user_id}: `, error);
        throw error; // Re-lanzar el error para que pueda ser manejado por el llamador
    }
}
async function getRole(role_id) {
    try {
        const [role] = await pool.query(`SELECT * FROM role_user WHERE id = ? LIMIT 1`, [role_id]);

        // Validar si el role tiene datos
        if (role.length === 0) {
            return null;
        }

        const response = {
            id: role[0].id,
            name: role[0].role_name,
            status: Boolean(role[0].status),
        };

        return response;
    } catch (error) {
        console.error(`Error al obtener el registro del role ${role_id}: `, error);
        throw error; // Re-lanzar el error para que pueda ser manejado por el llamador
    }
}
async function getCountry(organization_id) {

    try {
        const [organization] = await pool.query(`SELECT * FROM dc WHERE id = ? LIMIT 1`, [organization_id]);

        // Validar si el role tiene datos
        if (organization.length === 0) {
            return null;
        }

        const response = {
            id: organization[0].id,
            name: organization[0].name,
            commonName: organization[0].commun_name,
            status: Boolean(organization[0].status),
        };

        return response;
    } catch (error) {
        console.error(`Error al obtener el registro de la organization ${organization_id}: `, error);
        throw error; // Re-lanzar el error para que pueda ser manejado por el llamador
    }
}

/**
 * TODO Delete Many users
 */
const deletedMany = async (req, res, next) => {
    const { ids } = req.body;
    const user_id = req.user.id;

    try {
        const placeholders = ids.map(() => '?').join(', ');
        const query = `UPDATE users SET is_deleted = 1, status_id = ? WHERE id IN (${placeholders})`;

        // Combina el status_id con los ids en un solo array
        const params = [STATUS_USER.DELETED, ...ids];

        const [result] = await pool.query(query, params);

        if (result.affectedRows === 0) {
            const error = createError(
                "Error to delete users, please try again later", // Mensaje de error
                ["Error into database"], // Detalles
                req.traceId, // TraceId (si lo tienes)
                req.originalUrl // URL de la solicitud
            );
            return next(error); // Pasa el error al middleware de manejo de errores
        }

        // Logs inserts
        ids.forEach(id => {
            systemLogs(user_id, "Row deleted", id, MODULES.USERS);

            recyclerBin(id, MODULES.USERS, user_id);
        });

        res.status(204).json({ message: 'Users deleted successfully' });
    } catch (error) {
        next(error)
    }
}

/**
 * TODO Update password with next params
 * @param {Token, new password, confirm password} req 
 * @param {message} res 
 */
const changePassword = async (req, res, next) => {
    const { token, password, confirmPassword } = req.body;
    const user_id = req.user.id;

    try {
        // Validate if token is valid
        const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [user_id]);

        if (rows.length === 0) {
            const error = createError(
                "User not found", // Mensaje de error
                ["The user not exists"], // Detalles
                req.traceId, // TraceId (si lo tienes)
                req.originalUrl // URL de la solicitud
            );
            return next(error); // Pasa el error al middleware de manejo de errores
        }

        // Set a user
        const user = rows[0];

        console.log(user)

        // Validate if password and confirmPassword are the same
        if (password !== confirmPassword) {
            const error = createError(
                "Password and confirm password are not the same", // Mensaje de error
                ["The password and confirm password are not the same"], // Detalles
                req.traceId, // TraceId (si lo tienes)
                req.originalUrl // URL de la solicitud
            );
            return next(error); // Pasa el error al middleware de manejo de errores
        }

        // Validate token
        if (user.token_verification !== token) {
            const error = createError(
                "Token is not valid", // Mensaje de error
                ["The token is not valid"], // Detalles
                req.traceId, // TraceId (si lo tienes)
                req.originalUrl // URL de la solicitud
            );
            return next(error); // Pasa el error al middleware de manejo de errores
        }

        // Encrypt password
        const passwordEncrypted = await encryptPassword(password);

        // Update user password
        await pool.query('UPDATE users SET password = ?, recovery_password = 0, token_verification = ?, status_id = ? WHERE id = ?', [passwordEncrypted, null, STATUS_USER.ACTIVE, user_id]);

        // * Response the application
        return res.status(200).json({message: 'Password changed successfully.'});

    } catch (error) {
        next(error)
    }
}

const disabledMFA = async(req, res, next) => {
    const { id } = req.params;
    try
    {
        // Update user data
        await pool.query('UPDATE users SET mfa_enabled = 0, mfa_secret = NULL, mfa_verified = 0 WHERE id = ?', [id]);

        res.status(200).json({message:"MFA disabled succesfully"});
    }catch(error)
    {
        next(error);
    }
}   

module.exports = {
    getUsers,
    addUser,
    getUserById,
    updateUser,
    updateStatus,
    deleteUser,
    getLogs,
    deletedMany,
    changePassword,
    disabledMFA
}