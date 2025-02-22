const pool = require('../database/config');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { encryptPassword } = require('../utils/password');
const { sendAccessRequestEmail } = require('../utils/email');
const createError = require('../utils/createError');

// Login that require user and password
const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = rows[0];

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({ token });
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

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

const createUser = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const encryptPassword = bcrypt.hashSync(password, 10);
        const [rows] = await pool.query('INSERT INTO users (name, username, email, password) VALUES (?, ?, ?)', [name, email, encryptPassword]);
    } catch (error) {

    }
}

// Static user
const users = [{ id: 1, username: "otrejo@md360.com.mx", password: "12345689" }]

// Login with values statics
const loginManual = async (req, res) => {
    const { email, password } = req.body;

    const user = users.find(u => u.username === email && u.password === password);
    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ user_id: user.id }, process.env.JWT_SECRET, { expiresIn: '4h' });

    res.json({ token });
}


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
        return res.status(200).json({ status: true, message: 'Access Requests sent successfully.', data: [] });

    } catch (error) {
        next(error)
    }
}

module.exports = { login, validateMFA, loginManual, addAccessRequests };