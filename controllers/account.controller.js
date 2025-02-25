const pool = require('../database/config');
const { uploadImageToS3 } = require('../utils/aws');
const createError = require('../utils/createError');

const getMyAccount = async (req, res, next) => {
    const id = req.user.id;

    try {
        const [users] = await pool.query('SELECT * FROM vw_users WHERE id = ? LIMIT 1', [id]);

        if (users.length === 0) {
            const error = createError(
                "User not found", // Mensaje de error
                ["The ID user does not exists"], // Detalles
                req.traceId, // TraceId (si lo tienes)
                req.originalUrl // URL de la solicitud
            );
            return next(error); // Pasa el error al middleware de manejo de errores
        }

        // Get user data
        const user = users[0];

        const [role] = await pool.query('SELECT id, role_name, status FROM role_user WHERE id = ? LIMIT 1', [user.role_id]);

        const [organization] = await pool.query('SELECT * FROM vw_dcs WHERE id = ? LIMIT 1', [user.dc_id]);

        const [conf] = await pool.query('SELECT * FROM vw_configurations WHERE id = 1 LIMIT 1');

        const notifications = conf[0];

        const response = {
            id: user.id,
            fullName: user.fullname,
            email: user.email,
            phoneNumber: user.phone_number,
            status: Boolean(user.is_enabled),
            customerId: user.customer_id,
            activedMFA: user.mfa_enabled,
            role: {
                id: role[0].id,
                name: role[0].role_name
            },
            organization: {
                id: user.dc_id,
                name: organization[0].name,
                commonName: organization[0].commun_name,
                state: organization[0].state_province,
                city: organization[0].city,
                address: organization[0].address,
                status: Boolean(organization[0].status),
                country: {
                    id: organization[0].id_country,
                    name: organization[0].country,
                    isoCode: organization[0].iso
                }
            },
            notifyByEmail: Boolean(notifications.email_enabled),
            notifyByWhatsApp: Boolean(notifications.whatsapp),
            notifyBySms: Boolean(notifications.sms_enabled),
            onNewCase: Boolean(notifications.new_case),
            onNewComment: Boolean(notifications.new_comment),
            onNewAssignment: Boolean(notifications.new_assignment),
            onNewAccessRequest: Boolean(notifications.new_access_request)
        };

        res.status(200).json(response);
    } catch (err) {
        next(err);
    }
}

/**
 * TODO update profile 
 */
const updateProfile = async(req, res, next) => {
    const  id = req.user.id;
    const { fullName, phoneNumber, notifyByEmail, notifyByWhatsApp, notifyBySms, onNewCase, onNewComment, onNewAssignment, onNewAccessRequest } = req.body;

    try 
    {   
        // Update user data
        await pool.query('UPDATE users SET fullname = ?, phone_number = ? WHERE id = ?', [fullName, phoneNumber, id]);

        // Update conf_notification
        await pool.query('UPDATE conf_notification SET email_enabled = ?, whatsapp = ?, sms_enabled = ?, new_case = ?, new_comment = ?, new_assignment = ?, new_access_request = ? WHERE id = ?', [notifyByEmail, notifyByWhatsApp, notifyBySms, onNewCase, onNewComment, onNewAssignment, onNewAccessRequest, id]);

        res.status(200).json({message:"Profile updated succesfully"});
    }catch(error)
    {
        next(error);
    }
}

const uploadUserPhoto = async(req, res, next) => {
    const id = req.user.id;
    
    try
    {
        if (!req.file) {
            const error = createError(
                "No image provided", // Mensaje de error
                ["ImageBase is null or empty"], // Detalles
                req.traceId, // TraceId (si lo tienes)
                req.originalUrl // URL de la solicitud
            );
            return next(error); // Pasa el error al middleware de manejo de errores
        }

        const [users] = await pool.query('SELECT username FROM users WHERE id = ? LIMIT 1', [id]);
        const user = users[0];

        const imageBase64 = req.file.buffer;
        const imageType = req.file.mimetype.split('/')[1]; // Obtén el tipo de imagen (jpg, png, etc.)

        const imageURL = await uploadImageToS3(imageBase64, user.username, imageType);
        // Update user data
        await pool.query('UPDATE users SET photo = ? WHERE id = ?', [imageURL, id]);

        res.status(200).json({message:"Profile updated succesfully"});
    }catch(error)
    {
        next(error);
    }
}

module.exports = {
    getMyAccount,
    updateProfile,
    uploadUserPhoto
}
