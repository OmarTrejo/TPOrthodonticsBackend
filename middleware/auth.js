const jwt = require('jsonwebtoken')

const authenticateUser = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];
    console.log(token);

    if (!token) return res.status(401).json({ message: 'Anauthorized access, token not found' });

    try {
        // Verifica y decodifica el token usando el secreto
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { id: decoded.user_id }; // Guarda el user_id del token en req.user
        next(); // Continúa con la siguiente función o ruta
    } catch (error) {
        res.status(403).json({ error: 'Denied access, invalid token' })
    }
}

module.exports = authenticateUser;