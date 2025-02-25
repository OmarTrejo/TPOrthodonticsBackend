const pool = require("../database/config.js");

const insertNotification = async (userid) => {
    try {
        await pool.query('INSERT INTO conf_notification (user_id) VALUES (?)', [userid]);

    } catch (error) {
        console.log(error);
    }
}

module.exports = {
    insertNotification
}