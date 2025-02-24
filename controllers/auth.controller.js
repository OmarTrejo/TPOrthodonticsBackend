const pool = require('../database/config');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { encryptPassword } = require('../utils/password');
const { sendAccessRequestEmail } = require('../utils/email');
const createError = require('../utils/createError');

// Login that require user and password
const login = async (req, res, next) => {
    const { email, password } = req.body;

    try {
        const [rows] = await pool.query('SELECT * FROM vw_users WHERE email = ? LIMIT 1', [email]);

        if (rows.length === 0) {
            const error = createError(
                "Email not found", // Mensaje de error
                ["The email not exists"], // Detalles
                req.traceId, // TraceId (si lo tienes)
                req.originalUrl // URL de la solicitud
            );
            return next(error); // Pasa el error al middleware de manejo de errores
        }

        // Get user data
        const user = rows[0];

        // Validate if users is not deleted
        if (user.is_deleted) {
            const error = createError(
                "User not found", // Mensaje de error
                ["User is deleted"], // Detalles
                req.traceId, // TraceId (si lo tienes)
                req.originalUrl // URL de la solicitud
            );
            return next(error); // Pasa el error al middleware de manejo de errores
        }

        // Validate if users is enabled
        if (!user.is_enabled) {
            const error = createError(
                "User is not enabled", // Mensaje de error
                ["The user does´t have permissions"], // Detalles
                req.traceId, // TraceId (si lo tienes)
                req.originalUrl // URL de la solicitud
            );
            return next(error); // Pasa el error al middleware de manejo de errores
        }

        // Validate if user password match
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            const error = createError(
                "Password incorrect", // Mensaje de error
                ["The password is incorrect, not match"], // Detalles
                req.traceId, // TraceId (si lo tienes)
                req.originalUrl // URL de la solicitud
            );
            return next(error); // Pasa el error al middleware de manejo de errores
        }

        // Create token access
        const token = jwt.sign({ user_id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Consultar el role del usuario
        const [role] = await pool.query('SELECT id, role_name, status FROM role_user WHERE id = ? LIMIT 1', [user.role_id]);

        const [countrydc] = await pool.query('SELECT * FROM vw_dcs WHERE id = ? LIMIT 1', [user.dc_id]);
        // Consultar los modulos del role
        const [acls] = await pool.query('SELECT * FROM vw_access_control_list WHERE role_id = ?', [user.role_id]);

        // Construir la estructura de módulos y acciones
        const modulesMap = new Map();

        // Generación de map
        for (const acl of acls) {
            if (!modulesMap.has(acl.module_id)) {
                modulesMap.set(acl.module_id, {
                    id: acl.module_id,
                    name: acl.module,
                    status: Boolean(acl.is_enabled),
                    actions: []
                });
            }

            const module = modulesMap.get(acl.module_id);

            module.actions.push({
                id: acl.action_id,
                name: acl.action_name,
                enabled: true // Asumimos que todas las acciones están habilitadas
            });
        }

        const modules = Array.from(modulesMap.values());

        const response = {
            token: token,
            systemUser: {
                id: user.id,
                fullName: user.fullname,
                email: user.email,
                phoneNumber: user.phone_number,
                status: Boolean(user.is_enabled),
                customerId: user.customer_id,
                activedMFA: user.mfa_enabled,
                role: {
                    id: role[0].id,
                    name: role[0].role_name,
                    modules
                },
                organization: {
                    id: user.dc_id,
                    name: countrydc[0].name,
                    commonName: countrydc[0].commun_name,
                    state: countrydc[0].state_province,
                    city: countrydc[0].city,
                    address: countrydc[0].address,
                    status: Boolean(countrydc[0].status),
                    country: {
                        id: countrydc[0].id_country,
                        name: countrydc[0].country,
                        isoCode: countrydc[0].iso
                    }
                }
            }
        };

        res.status(200).json(response);
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// Add new access requests to new user
const addAccessRequests = async (req, res, next) => {
    const { fullName, email, password, confirmPassword } = req.body;

    try {
        // Validate if users exist
        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);

        // Validate if users exist
        if (users.length > 0) {
            const error = createError(
                "User existing", // Mensaje de error
                ["The user that exists"], // Detalles
                req.traceId, // TraceId (si lo tienes)
                req.originalUrl // URL de la solicitud
            );
            return next(error); // Pasa el error al middleware de manejo de errores
        }

        // Validate if passwords match
        if (password !== confirmPassword) {
            const error = createError(
                "Las contraseñas no coinciden", // Mensaje de error
                ["Las contraseñas proporcionadas no son iguales"], // Detalles
                req.traceId, // TraceId (si lo tienes)
                req.originalUrl // URL de la solicitud
            );
            return next(error); // Pasa el error al middleware de manejo de errores
        }

        // Encrypt password
        const passwordEncrypted = await encryptPassword(password);

        const [rows] = await pool.query('INSERT INTO request_user (fullname, email, password) VALUES (?, ?, ?)', [fullName, email, passwordEncrypted]);

        if (rows.affectedRows === 0) {
            const error = createError(
                "Error to create", // Mensaje de error
                ["Error to create requests. Please try again later"], // Detalles
                req.traceId, // TraceId (si lo tienes)
                req.originalUrl // URL de la solicitud
            );
            return next(error); // Pasa el error al middleware de manejo de errores
        }

        // Send email notification
        sendAccessRequestEmail(email, fullName)

        // * Response the application
        return res.status(200).json({message: 'Access Requests sent successfully.'});

    } catch (error) {
        next(error)
    }
}

const validateMFA = async (req, res) => {
    const { userId, mfaCode } = req.body;

    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Usuario no encontrado' });
        }

        const user = rows[0];

        const mfaMatch = await bcrypt.compare(mfaCode, user.mfa_code);

        if (!mfaMatch) {
            return res.status(401).json({ message: 'Código MFA inválido' });
        }

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({ token });
    } catch (error) {
        console.error('Error al validar MFA:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }

}


module.exports = { login, addAccessRequests };