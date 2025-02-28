const pool = require("../database/config.js");
const { MODULES } = require("./constants.js");

/**
 * TODO Save into database a notifications
 * @param {title} title 
 * @param {message} message 
 * @param {transmitter} transmitter 
 * @param {receiver} receiver 
 */
const sendNotification = async (title, message, transmitter, module, id) => {
    try {
        let redirectUrl = null;

        if (module === MODULES.CASES)
        {
            redirectUrl = `/service-cases/${id}`
        }
        else if (module === MODULES.REQUESTS)
        {
            redirectUrl = "/access-requests"
        }

        // Get all users that have a conf-notification with the action
        const receivers = await getReceivers(title);
        // Save into database a notifications
        for (const receiver of receivers) {
            const receiverId = receiver.id;
            await pool.query('INSERT INTO notifications (title, message, transmitterId, receiverId, redirectUrl) VALUES (?, ?, ?, ?, ?)', [title, message, transmitter, receiverId, redirectUrl]);

            if(receiver.email_enabled)
            {
                // Send email to user
                console.log("Send email to user", receiver.email)
            }

            if(receiver.sms_enabled) {
                // Send email to user
                console.log("Send sms to user", receiver.phone_number)
            }

            if(receiver.whatsapp) {
                // Send email to user
                console.log("Send whatsapp to user", receiver.phone_number)
            }

        }
    } catch (error) {
        console.log(error);
    }
}   

const getReceivers = async (title) => {
    try {
        let query = null;

        if( title === "New Case Created")
        {
            // Create a query that get all users with role tech and admin and have a check en get notifications by new case
            query = `
                SELECT u.id, u.fullname, u.email, u.phone_number, cn.email_enabled, cn.sms_enabled, cn.whatsapp FROM users u
                JOIN role_user r ON u.role_id = r.id
                JOIN conf_notification cn ON cn.user_id = u.id 
                WHERE r.role_name IN ('Tech', 'Admin') AND cn.new_case = 1;
            `;
        }
        else if (title === "New access request")
        {
            query = `
                SELECT u.id, u.fullname, u.email, u.phone_number, cn.email_enabled, cn.sms_enabled, cn.whatsapp FROM users u
                JOIN role_user r ON u.role_id = r.id
                JOIN conf_notification cn ON cn.user_id = u.id
                WHERE r.role_name IN ('Support') AND cn.new_access_request = 1;
            `;
        }
        // else if (title === "New message added")
        // {
        //     query = `
        //         SELECT u.id, u.fullname, u.email, u.phone_number FROM users u
        //         JOIN role_user r ON u.role_id = r.id
        //         JOIN conf_notification cn ON cn.user_id = u.id
        //         WHERE r.role_name IN ('Doctor', 'Admin') AND cn.assigned_case = 1;
        //     `;
        // }

        const [result] = await pool.query(query);
        return result;
    } catch (error) {
        console.log(error);
    }
}

module.exports = {
    sendNotification
}