const logger = require('./logger');
const pool = require("../database/config.js");

const systemLogs = async (userid, action, idmodified, moduleid) => {
    try {
        const [result] = await pool.query('INSERT INTO logs_system (modified_id, module_id, user_id, action) VALUES (?, ?, ?, ?)', [idmodified, moduleid, userid, action]);
    
        if (result.affectedRows === 0) {
            logger.error('Error to update logs, Please try again later.');
        }

    } catch (error) {
        logger.error(error)
    }
}

module.exports = {
    systemLogs
}