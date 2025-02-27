const { formattedDate } = require("../utils/dates");
const { paginateQuery } = require('../utils/pagination');
const { STATUS_CASE, MODULES } = require("../utils/constants");
const { uploadFileToS3 } = require("../utils/aws");
const { systemLogs } = require('../utils/systemLogs');
const path = require('path');
const pool = require('../database/config');
const createError = require('../utils/createError');
/**
 * TODO Get all cases for role
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
const getAllCases = async (req, res, next) => {
    const { page, pageSize, ...filters } = req.query;

    try {
        // * Conversión y validación
        const validatedPage = parseInt(page, 10) || 1;
        const validatedPageSize = parseInt(pageSize, 10) || 10;

        // * SQL Query base
        const baseQuery = "SELECT * FROM vw_cases";
        const countQuery = "SELECT COUNT(*) AS total FROM vw_cases";

        // Obtener datos paginados
        const paginatedData = await paginateQuery(baseQuery, countQuery, filters, validatedPage, validatedPageSize);

        // Formatear los resultados
        const filteredResponse = await Promise.all(paginatedData.results.map(async (item) => {

            // Get treatmentType
            const [treatmentType] = await pool.query('SELECT id, type_name FROM type_case WHERE id = ? LIMIT 1', [item.type_case_id]);

            // Get caseStatus
            const [caseStatus] = await pool.query('SELECT id, status, span_color, general FROM status_case WHERE id = ? LIMIT 1', [item.status_case_id]);

            // Get organization
            const [organization] = await pool.query('SELECT id, name FROM dc WHERE id = ? LIMIT 1', [item.organization_id]);

            // Get doctor
            const [doctor] = await pool.query('SELECT id, fullname, email FROM users WHERE id = ? LIMIT 1', [item.customer_id]);

            // Get tech
            let tech = { id: null, fullname: null, email: null };

            // Validated if have a tech assigned
            if (item.tech_id > 0) {
                const [rows] = await pool.query('SELECT id, fullname, email FROM users WHERE id = ? LIMIT 1', [item.tech_id]);

                if (rows.length > 0) {
                    tech = {
                        id: rows[0].id,
                        fullName: rows[0].fullname,
                        email: rows[0].email
                    };
                }
            }

            return {
                id: item.id,
                name: item.name,
                patientName: item.patient_name,
                caseStatus: {
                    id: caseStatus[0].id,
                    name: caseStatus[0].status,
                    color: caseStatus[0].span_color,
                    general: caseStatus[0].general,
                },
                additionalInfo: item.observations,
                generalComments: item.general_comments,
                technicalSpecifications: item.tech_observations,
                orderNumber: item.order_number,
                viewerUrl: item.url_viewer,
                isDeleted: Boolean(item.is_deleted),
                treatmentType: {
                    name: treatmentType[0].type_name,
                    id: treatmentType[0].id
                },
                organization: organization[0],
                doctor: {
                    id: doctor[0].id,
                    fullName: doctor[0].fullname
                },
                tech,
                createdOn: formattedDate(item.created_at)
            };
        })
        );

        // Construir la respuesta
        const response = {
            ...paginatedData,
            results: filteredResponse,
        };

        res.status(200).json(response);
    } catch (error) {
        next(error)
    }
}

const createCase = async (req, res, next) => {
    try {
        const { name, patientName, additionalInfo, generalComments, technicalSpecifications, treatmentTypeId } = req.body;
        const user_id = req.user.id; // Doctor

        if (!name || !patientName || !treatmentTypeId) {
            return next(createError("Required fields are missing", ["name are missing", "patient name are missing", "treatmentTypeId are missing"], req.traceId, req.originalUrl));
        }

        // Validar archivo
        if (!req.file) {
            return next(createError("Error, file is required", ["Database connection error"], req.traceId, req.originalUrl));
        }

        const [user] = await pool.query('SELECT * FROM users WHERE id = ? LIMIT 1', [user_id]);

        const [caseCreated] = await pool.query(
            'INSERT INTO cases (name, patient_name, observations, general_comments, tech_observations, type_case_id, customer_id, status_case_id, organization_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [name, patientName, additionalInfo, generalComments, technicalSpecifications, treatmentTypeId, user_id, STATUS_CASE.UNNASIGNED, user[0].dc_id]
        );

        if (caseCreated.affectedRows === 0) {
            return next(createError("Error, please try again later", ["Database connection error"], req.traceId, req.originalUrl));
        }

        // Convertir archivo a base64
        const attachmentTreatmentType = req.file.buffer;

        // Convert size to MB
        const attachmentFormSize = (req.file.size / (1024 * 1024)).toFixed(2);

        const fileName = req.file.originalname;  // Nombre original del archivo
        const extension = fileName.split('.').pop(); // Extraer la extensión
        // Nombre seguro del archivo

        const safeAttachmentFormName = path.basename(fileName).replace(/\s/g, "_");

        const folderName = `cases/${caseCreated.insertId}/${safeAttachmentFormName}`;

        // Subir archivo a S3
        try {
            const urlFile = await uploadFileToS3(attachmentTreatmentType, folderName);
            // Save into database
            saveUploadedFile(caseCreated.insertId, urlFile, safeAttachmentFormName, `${attachmentFormSize}MB`, extension);
        } catch (error) {
            console.error("Error uploading to S3:", error);
            return next(createError("Failed to upload file", [error.message], req.traceId, req.originalUrl));
        }

        // Guardar logs del sistema
        systemLogs(user_id, "New row inserted", caseCreated.insertId, MODULES.CASES);

        res.status(201).json({ message: 'Create case successfully' });

    } catch (error) {
        next(error);
    }
};

/**
 * TODO update only the URL viewer for tech
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
const updateUrlViewer = async (req, res, next) => {
    const { id } = req.params;
    const { urlViewer } = req.body;
    const user_id = req.user.id;

    try {
        // Update case with id
        const [result] = await pool.query('UPDATE cases SET url_viewer = ? WHERE id = ?', [urlViewer, id]);
        if (result.affectedRows === 0) {
            return next(createError("Error, please try again later", ["Database connection error"], req.traceId, req.originalUrl));
        }

        // Guardar logs del sistema
        systemLogs(user_id, "Row updated add URL Viewer", id, MODULES.CASES);

        res.status(200).json({ message: 'Update case successfully' });
    } catch (error) {
        next(error);
    }
}

/**
 * TODO update only the order number 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
const updateOrderNumber = async (req, res, next) => {
    const { id } = req.params;
    const { orderNumber } = req.body;
    const user_id = req.user.id;

    try {
        // Update case with id
        const [result] = await pool.query('UPDATE cases SET order_number = ? WHERE id = ?', [orderNumber, id]);
        if (result.affectedRows === 0) {
            return next(createError("Error, please try again later", ["Database connection error"], req.traceId, req.originalUrl));
        }

        // Guardar logs del sistema
        systemLogs(user_id, "Row updated add Order Number", id, MODULES.CASES);

        res.status(200).json({ message: 'Update case successfully' });
    } catch (error) {
        next(error);
    }
}

const assignedCase = async (req, res, next) => {
    const { id } = req.params;
    const techId = req.user.id;

    try {
        // Update case with id
        const [result] = await pool.query('UPDATE cases SET tech_id = ?, status_case_id = ? WHERE id = ?', [techId, STATUS_CASE.IN_PROGRESS, id]);
        if (result.affectedRows === 0) {
            return next(createError("Error, please try again later", ["Database connection error"], req.traceId, req.originalUrl));
        }

        // Guardar logs del sistema
        systemLogs(techId, "Row updated add Tech", id, MODULES.CASES);

        res.status(200).json({ message: 'Update case successfully' });
    } catch (error) {
        next(error);
    }
}

const uploadMultipleFiles = async (req, res, next) => {
    const { caseId } = req.body;
    const user_id = req.user.id;

    try {
        // Validar archivos
        if (!req.files) {
            return next(createError("Error, files is required", ["Database connection error"], req.traceId, req.originalUrl));
        }

        // Iterar sobre los archivos
        for (const file of req.files) {
            const attachmentFormBase64 = file.buffer;
            const attachmentFormSize = (file.size / (1024 * 1024)).toFixed(2);
            const safeAttachmentFormName = path.basename(file.originalname).replace(/\s/g, "_");
            const safeExtension = path.extname(file.originalname);
            const folderName = `cases/${caseId}/${safeAttachmentFormName}`;

            // Subir archivo a S3
            try {
                const urlFile = await uploadFileToS3(attachmentFormBase64, folderName);

                // Save into database
                saveUploadedFile(caseId, urlFile, safeAttachmentFormName, `${attachmentFormSize}MB`, safeExtension);

            } catch (error) {
                console.error("Error uploading to S3:", error);
                return next(createError("Failed to upload file", [error.message], req.traceId, req.originalUrl));
            }
        }

        // System logs
        systemLogs(user_id, "File add into case", caseId, MODULES.CASES);

        // Response
        res.status(201).json({ message: 'Files uploaded successfully' });

    }
    catch (error) {
        next(error);
    }
}

/**
 * TODO Add messages case
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
const addMessagesCase = async (req, res, next) => {
    const { caseStatusId, message, caseId } = req.body;
    const user_id = req.user.id;

    try {
        const [result] = await pool.query(
            'INSERT INTO messages_case (case_id, user_id, status_case_id, message) VALUES (?, ?, ?, ?)',
            [caseId, user_id, caseStatusId, message]
        );

        if (result.affectedRows === 0) {
            return next(createError("Error, please try again later", ["Database connection error"], req.traceId, req.originalUrl));
        }

        // Guardar logs del sistema
        systemLogs(user_id, "New message add", result.insertId, MODULES.CASES);

        // Get data from message
        const [messageData] = await pool.query('SELECT * FROM messages_case WHERE id = ? LIMIT 1', [result.insertId]);

        if (messageData.length === 0) {
            return next(createError("Error, please try again later", ["Error to get data from message"], req.traceId, req.originalUrl));
        }

        const messageDataResponse = messageData[0];

        // Get system user
        const [systemUser] = await pool.query('SELECT id, fullname, email, photo FROM users WHERE id = ? LIMIT 1', [messageDataResponse.user_id]);
        // Get caseStatus
        const [caseStatus] = await pool.query('SELECT id, status, span_color, general FROM status_case WHERE id = ? LIMIT 1', [messageDataResponse.status_case_id]);

        const filteredResponse = {
            id: messageDataResponse.id,
            caseId: messageDataResponse.case_id,
            systemUser: {
                id: systemUser[0].id,
                fullName: systemUser[0].fullname,
                email: systemUser[0].email,
                avatarUrl: systemUser[0].photo
            },
            message: messageDataResponse.message,
            caseStatus: {
                id: caseStatus[0].id,
                name: caseStatus[0].status,
                color: caseStatus[0].span_color,
                general: caseStatus[0].general,
            },
            createdOn: formattedDate(messageDataResponse.created_at)
        };

        res.status(201).json(filteredResponse);
    } catch (error) {
        next(error);
    }
}

/**
 * TODO get All messages for case
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
const getMessageCases = async (req, res, next) => {
    const { page, pageSize, ...filters } = req.query;

    try {
        // Conversión y validación
        const validatedPage = parseInt(page, 10) || 1;
        const validatedPageSize = parseInt(pageSize, 10) || 10;

        // * SQL Query base
        const baseQuery = "SELECT * FROM vw_messages";
        const countQuery = "SELECT COUNT(*) AS total FROM vw_messages";

        // Add order by to the filters
        const orderBy = { column: 'created_at', direction: 'DESC' };

        // Obtener datos paginados
        const paginatedData = await paginateQuery(baseQuery, countQuery, filters, validatedPage, validatedPageSize, orderBy);

        // Formatear los resultados
        const filteredResponse = await Promise.all(
            paginatedData.results.map(async (item) => {
                // Get system user
                const [systemUser] = await pool.query('SELECT id, fullname, email, photo FROM users WHERE id = ? LIMIT 1', [item.user_id]);
                // Get caseStatus
                const [caseStatus] = await pool.query('SELECT id, status, span_color, general FROM status_case WHERE id = ? LIMIT 1', [item.status_case_id]);

                return {
                    id: item.id,
                    caseId: item.case_id,
                    systemUser: {
                        id: systemUser[0].id,
                        fullName: systemUser[0].fullname,
                        email: systemUser[0].email,
                        avatarUrl: systemUser[0].photo
                    },
                    message: item.message,
                    caseStatus: {
                        id: caseStatus[0].id,
                        name: caseStatus[0].status,
                        color: caseStatus[0].span_color,
                        general: caseStatus[0].general,
                    },
                    createdOn: formattedDate(item.created_at)
                };



            })
        );

        // Construir la respuesta
        const response = {
            ...paginatedData,
            results: filteredResponse,
        };

        res.status(200).json(response);
    } catch (error) {
        next(error)
    }
}

/**
 * TODO get all files by case
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
const getFilesCases = async (req, res, next) => {
    const { id } = req.params;
    const user_id = req.user.id;

    try {
        // Get files by id
        const [results] = await pool.query('SELECT * FROM vw_files_cases WHERE case_id = ?', [id]);

        if (results.length === 0) {
            return next(createError("Error, please try again later", ["Database connection error"], req.traceId, req.originalUrl));
        }

        const filteredResponse = results.map((item) => {
                return {
                    id: item.id,
                    url: item.url_file,
                    name: item.file_name,
                    size: item.size,
                    extension: item.extension,
                    uploadedDate: formattedDate(item.created_at),
                    caseId: item.case_id,
                };
            });

        res.status(200).json(filteredResponse);
    } catch (error) {
        next(error);
    }
}

/**
 * TODO get case by Id
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
const getCaseById = async (req, res, next) => {
    const { id } = req.params;

    try {
        const [result] = await pool.query('SELECT * FROM vw_cases WHERE id = ? LIMIT 1', [id]);

        if (result.length === 0) {
            return next(createError("Error, please try again later", ["Database connection error"], req.traceId, req.originalUrl));
        }

        const caseData = result[0];

        // Get treatmentType
        const [treatmentType] = await pool.query('SELECT id, type_name FROM type_case WHERE id = ? LIMIT 1', [caseData.type_case_id]);

        // Get caseStatus
        const [caseStatus] = await pool.query('SELECT id, status, span_color FROM status_case WHERE id = ? LIMIT 1', [caseData.status_case_id]);

        // Get organization
        const [organization] = await pool.query('SELECT id, name FROM dc WHERE id = ? LIMIT 1', [caseData.organization_id]);

        // Get doctor
        const [doctor] = await pool.query('SELECT id, fullname, email FROM users WHERE id = ? LIMIT 1', [caseData.customer_id]);

        // Get tech
        let tech = { id: null, fullname: null, email: null };

        // Validated if have a tech assigned
        if (caseData.tech_id > 0) {
            const [rows] = await pool.query('SELECT id, fullname, email FROM users WHERE id = ? LIMIT 1', [caseData.tech_id]);
            if (rows.length > 0) {
                tech = {
                    id: rows[0].id,
                    fullName: rows[0].fullname,
                    email: rows[0].email
                };
            }
        }

        const filteredResponse = {
            id: caseData.id,
            name: caseData.name,
            patientName: caseData.patient_name,
            caseStatus:  {
                id: caseStatus[0].id,
                name: caseStatus[0].status,
                color: caseStatus[0].span_color,
                general: caseStatus[0].general,
            },
            additionalInfo: caseData.observations,
            generalComments: caseData.general_comments,
            technicalSpecifications: caseData.tech_observations,
            orderNumber: caseData.order_number,
            viewerUrl: caseData.url_viewer,
            isDeleted: Boolean(caseData.is_deleted),
            treatmentType: {
                name: treatmentType[0].type_name,
                id: treatmentType[0].id
            },
            organization: organization[0],
            doctor: {
                id: doctor[0].id,
                fullName: doctor[0].fullname
            },
            tech,
            createdOn: formattedDate(caseData.created_at)
        };

        res.status(200).json(filteredResponse);
    } catch (error) {
        next(error);
    }
}

const saveUploadedFile = async (caseId, urlS3, filename, size, extension) => {
    try {
        const [result] = await pool.query(
            'INSERT INTO files_cases (case_id, url_file, file_name, size, extension) VALUES (?, ?, ?, ?, ?)',
            [caseId, urlS3, filename, size, extension]
        );
        return result.insertId;
    } catch (error) {
        throw (error);
    }
}

module.exports = {
    getAllCases,
    createCase,
    updateUrlViewer,
    updateOrderNumber,
    uploadMultipleFiles,
    assignedCase,
    addMessagesCase,
    getCaseById,
    getMessageCases,
    getFilesCases
}