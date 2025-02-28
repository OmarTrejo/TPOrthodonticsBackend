const pool = require('../database/config');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

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

        const [conf] = await pool.query('SELECT * FROM vw_configurations WHERE user_id = ? LIMIT 1', [id]);

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
                    schemaName: acl.schemaName,
                    actions: []
                });
            }

            const module = modulesMap.get(acl.module_id);

            module.actions.push({
                id: acl.action_id,
                name: acl.action_name,
                schemaName: acl.acSchemaName,
                enabled: Boolean(acl.is_enabled) // Asumimos que todas las acciones están habilitadas
            });
        }

        const modules = Array.from(modulesMap.values());

        const notifications = conf[0];

        const response = {
            id: user.userId,
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
            onNewAccessRequest: Boolean(notifications.new_access_request),
            avatarUrl: user.photo,
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
        await pool.query('UPDATE conf_notification SET email_enabled = ?, whatsapp = ?, sms_enabled = ?, new_case = ?, new_comment = ?, new_assignment = ?, new_access_request = ? WHERE user_id = ?', [notifyByEmail, notifyByWhatsApp, notifyBySms, onNewCase, onNewComment, onNewAssignment, onNewAccessRequest, id]);

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

/**
 * Activate or enabled MFA
 */
const enabledMFA = async(req, res, next) => {
    const id = req.user.id;
    const secret = speakeasy.generateSecret({ length: 20 });

    // Generar URL compatible con Google Authenticator, Authy, Microsoft Authenticator
    const otpauthUrl = secret.otpauth_url + `&issuer=MiApp`;

    const qrCodeImage = await QRCode.toDataURL(otpauthUrl);

    try
    {
        // Update user data
        await pool.query('UPDATE users SET mfa_secret = ? WHERE id = ?', [secret.base32, id]);

        res.status(200).json({ qrCodeImage, secret: secret.base32});
    }catch(error)
    {
        next(error);
    }
}

/**
 * Verify MFA
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
const veryfiedMFA = async(req, res, next) => {
    const id = req.user.id;
    const { token } = req.body;

    try
    {
        const [users] = await pool.query('SELECT mfa_secret FROM users WHERE id = ? LIMIT 1', [id]);

        // Validate user
        if (users.length === 0) {
            const error = createError(
                "User not found", // Mensaje de error
                ["The ID user does not exists"], // Detalles
                req.traceId, // TraceId (si lo tienes)
                req.originalUrl // URL de la solicitud
            );
            return next(error); // Pasa el error al middleware de manejo de errores
        }
        // Init user
        const user = users[0];

        const verified = speakeasy.totp.verify({
            secret: user.mfa_secret,
            encoding: 'base32',
            token: token,
            window: 1 // Ajusta este valor según tus necesidades
        });

        if (!verified) {
            const error = createError(
                "Invalid token", // Mensaje de error
                ["The token is not valid"], // Detalles
                req.traceId, // TraceId (si lo tienes)
                req.originalUrl // URL de la solicitud
            );
            return next(error); // Pasa el error al middleware de manejo de errores
        }

        // Update DB
        await pool.query('UPDATE users SET mfa_enabled = 1, mfa_verified = 1 WHERE id = ?', [id]);

        res.status(200).json({message:"MFA verified succesfully"});
    }catch(error)
    {
        next(error);
    }
}

module.exports = {
    getMyAccount,
    updateProfile,
    uploadUserPhoto,
    enabledMFA,
    veryfiedMFA
}
