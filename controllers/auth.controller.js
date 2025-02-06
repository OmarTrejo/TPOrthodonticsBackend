const pool = require('../database/config');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

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

const createUser = async( req, res ) =>  {
    const { name, email, password } = req.body;

    try {
        const encryptPassword = bcrypt.hashSync(password, 10);
        const [rows] = await pool.query('INSERT INTO users (name, username, email, password) VALUES (?, ?, ?)', [name, email, encryptPassword]);
    } catch (error) {
        
    }
}

// Static user
const users = [{id: 1, username: "otrejo@md360.com.mx", password:"123456"}]

// Login with values statics
const loginManual = async (req, res) => {
    const { username, password } = req.body;

    const user = users.find(u=> u.username===username && u.password === password);
    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token });
}

module.exports = { login, validateMFA, loginManual };