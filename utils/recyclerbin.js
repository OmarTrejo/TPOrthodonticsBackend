const logger = require('./logger');
const pool = require("../database/config.js");

const recyclerBin = async (record_id, module_id, systemuser_id) => {
    try {
        const [result] = await pool.query('INSERT INTO recyclebin (record_id, module_id, systemuser_id) VALUES (?, ?, ?)', [record_id, module_id, systemuser_id]);
    
        if (result.affectedRows === 0) {
            logger.error('Error to update logs, Please try again later.');
        }

    } catch (error) {
        logger.error(error)
    }
}


module.exports = {
    recyclerBin
}