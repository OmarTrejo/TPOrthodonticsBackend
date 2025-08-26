const { formattedDate } = require("../utils/dates");
const { paginateQuery } = require('../utils/pagination');
const { STATUS_CASE, MODULES, ROLES_USER } = require("../utils/constants");
const { uploadFileToS3, deleteFileFromS3 } = require("../utils/aws");
const { systemLogs } = require('../utils/systemLogs');
const path = require('path');
const pool = require('../database/config');
const createError = require('../utils/createError');
const { recyclerBin } = require("../utils/recyclerbin");
const { sendNotification } = require("../utils/notifications");
/**
 * TODO Get all cases for role
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
const getAllCases = async (req, res, next) => {
    const { page, pageSize, ...filters } = req.query;
    const userId = req.user.id;
    try {
        const [user] = await pool.query('SELECT role_id FROM users WHERE id = ?', [userId]);

        // * Conversión y validación
        const validatedPage = parseInt(page, 10) || 1;
        const validatedPageSize = parseInt(pageSize, 10) || 10;

        // * SQL Query base
        const baseQuery = "SELECT * FROM vw_cases";
        const countQuery = "SELECT COUNT(*) AS total FROM vw_cases";

        // Validación de los filtros de periodicity:
        // Copia segura
        let transformedFilters = { ...filters };

        // statusId → status_case_id
        // Procesar statusId primero
        if (transformedFilters.statusId !== undefined) {
            const statusId = parseInt(transformedFilters.statusId, 10);
            if (statusId === 0) {
                // Excluir 12 y 20 porque 0 significa "todos menos esos"
                transformedFilters.excludeStatuses = [STATUS_CASE.CANCELLED, STATUS_CASE.DELETED, STATUS_CASE.COMPLETED, STATUS_CASE.UNNASIGNED ];
                delete transformedFilters.status_case_id;
            } else {
                // statusId específico: mostrar solo ese status
                transformedFilters.status_case_id = statusId;
                delete transformedFilters.excludeStatuses;  // asegurar que no exista excludeStatuses
            }
            delete transformedFilters.statusId;
        }


        // Agregar filtro de periodicity si viene en los parámetros
        if (transformedFilters.periodicity) {
            const days = parseInt(transformedFilters.periodicity, 10);
            transformedFilters.created_at_from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
            delete transformedFilters.periodicity;
        }

        // Solo agregar excludeStatuses si no hay status_case_id definido
        if (!transformedFilters.status_case_id) {
            transformedFilters.excludeStatuses = [
                STATUS_CASE.CANCELLED,
                STATUS_CASE.DELETED,
            ];
        }

        // Obtener datos paginados
        const filtersToUse = { ...transformedFilters };
        if (user[0].role_id == ROLES_USER.DOCTOR) {
            filtersToUse.customer_id = userId;
        }

        if (user[0].role_id == ROLES_USER.TECH) {
            filtersToUse.customWhere = `(tech_id = ${userId} OR (tech_id IS NULL AND status_case_id = ${STATUS_CASE.UNNASIGNED}))`;
        }

        const paginatedData = await paginateQuery(
            baseQuery,
            countQuery,
            filtersToUse,
            validatedPage,
            validatedPageSize
        );
        // Formatear los resultados
        const filteredResponse = await Promise.all(paginatedData.results.map(async (item) => {

            // Get treatmentType
            const [treatmentType] = await pool.query('SELECT id, type_name FROM type_case WHERE id = ? LIMIT 1', [item.type_case_id]);

            // Get caseStatus
            const [caseStatus] = await pool.query('SELECT id, status, span_color, general FROM status_case WHERE id = ? LIMIT 1', [item.status_case_id]);

            // Get organization
            const [organization] = await pool.query('SELECT id, country FROM countries WHERE id = ? LIMIT 1', [item.organization_id]);
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
                orderNumber: item.order_number,
                viewerUrl: item.url_viewer,
                isDeleted: Boolean(item.is_deleted),
                treatmentType: {
                    name: treatmentType[0].type_name,
                    id: treatmentType[0].id
                },
                organization: {
                    id: organization[0].id,
                    name: organization[0].country,
                    commonName: organization[0].country,
                },
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
        const { name, patientName, additionalInfo, treatmentTypeId, requireRevision } = req.body;
        const user_id = req.user.id; // Doctor

        // Get treatmentType
        const [treatmentType] = await pool.query('SELECT id, type_name, is_pdf_file FROM type_case WHERE id = ? LIMIT 1', [treatmentTypeId])

        if (!name || !patientName || !treatmentTypeId) {
            return next(createError("Required fields are missing", ["name are missing", "patient name are missing", "treatmentTypeId are missing"], req.traceId, req.originalUrl));
        }

        const [user] = await pool.query('SELECT * FROM users WHERE id = ? LIMIT 1', [user_id]);

        const [caseCreated] = await pool.query(
            'INSERT INTO cases (name, patient_name, observations, type_case_id, customer_id, status_case_id, organization_id, require_revision) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [name, patientName, additionalInfo, treatmentTypeId, user_id, STATUS_CASE.UNNASIGNED, user[0].dc_id, requireRevision]
        );
        // Subir archivo a S3
        try {
            if (treatmentType[0].is_pdf_file) {

                if (caseCreated.affectedRows === 0) {
                    return next(createError("Error, please try again later", ["Database connection error"], req.traceId, req.originalUrl));
                }

                // Validar archivo
                if (!req.file) {
                    return next(createError("Error, file is required", ["Database connection error"], req.traceId, req.originalUrl));
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
                const urlFile = await uploadFileToS3(attachmentTreatmentType, folderName);
                // Save into database
                saveUploadedFile(caseCreated.insertId, urlFile, safeAttachmentFormName, `${attachmentFormSize}MB`, extension);
            }
        } catch (error) {
            console.error("Error uploading to S3:", error);
            return next(createError("Failed to upload file", [error.message], req.traceId, req.originalUrl));
        }

        // Guardar logs del sistema
        systemLogs(user_id, "New row inserted", caseCreated.insertId, MODULES.CASES);

        // Send a notification to All users techs
        sendNotification("New Case Created", "A new support case has been created. Please review the details and take action as needed.", user_id, MODULES.CASES, caseCreated.insertId);

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

        // Validate if url contains https://tpoviewer.tportho.com
        if (!urlViewer.includes('https://tpoviewer.tportho.com')) {
            return next(createError("Error, please try again later", ["The URL is not valid"], req.traceId, req.originalUrl));
        }

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

/**
 * TODO update only the order number 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
const updateCustomerIdFromCase = async (req, res, next) => {
    const { id } = req.params;
    const { customerId } = req.body;
    const user_id = req.user.id;

    try {

        const [userData] = await pool.query('SELECT customer_id FROM cases WHERE id = ? LIMIT 1', [id]);
        
        if (userData.length === 0) {
            return next(createError("Case not found", ["The case does not exist"], req.traceId, req.originalUrl));
        }

        const { customer_id } = userData[0];

        // Update case with id
        const [result] = await pool.query('UPDATE users SET customer_id = ? WHERE id = ?', [customerId, customer_id]);
        if (result.affectedRows === 0) {
            return next(createError("Error, please try again later", ["Database connection error"], req.traceId, req.originalUrl));
        }

        // Guardar logs del sistema
        systemLogs(user_id, "Row updated add user ", id, MODULES.CASES);

        res.status(200).json({ message: 'Update account number successfully' });
    } catch (error) {
        next(error);
    }
}

const assignedCase = async (req, res, next) => {
    const { id } = req.params;
    const { techId } = req.body;

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
        // Verificar si el usuario está asignado al caso
        const [caseData] = await pool.query('SELECT customer_id, tech_id FROM cases WHERE id = ? LIMIT 1', [caseId]);
        
        if (caseData.length === 0) {
            return next(createError("Case not found", ["The case does not exist"], req.traceId, req.originalUrl));
        }
        
        const { customer_id, tech_id } = caseData[0];
        
        // Verificar si el usuario actual es el doctor asignado o el tech asignado
        if (user_id !== customer_id && user_id !== tech_id) {
            return next(createError("Access denied", ["You are not authorized to add messages to this case"], req.traceId, req.originalUrl));
        }

        const [result] = await pool.query(
            'INSERT INTO messages_case (case_id, user_id, status_case_id, message) VALUES (?, ?, ?, ?)',
            [caseId, user_id, (caseStatusId) ? caseStatusId : null, message]
        );

        if (result.affectedRows === 0) {
            return next(createError("Error, please try again later", ["Database connection error"], req.traceId, req.originalUrl));
        }

        if (caseStatusId) {
            // Update status from case
            await pool.query('UPDATE cases SET status_case_id = ? WHERE id = ?', [caseStatusId, caseId]);
        }

        // Guardar logs del sistema
        systemLogs(user_id, "New message add", caseId, MODULES.CASES);

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

        let caseStatusData = null;
        if (caseStatus.length > 0) {
            // Corregido el error en la asignación
            caseStatusData = {
                id: caseStatus[0].id,
                name: caseStatus[0].status,
                color: caseStatus[0].span_color,
                general: caseStatus[0].general,
            };
        }

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
            caseStatus: caseStatusData,
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
    const { id } = req.params;

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
        const paginatedData = await paginateQuery(baseQuery, countQuery, { ...filters, case_id: id }, validatedPage, validatedPageSize, orderBy);

        // Formatear los resultados
        const filteredResponse = await Promise.all(
            paginatedData.results.map(async (item) => {
                // Get system user
                const [systemUser] = await pool.query('SELECT id, fullname, email, photo FROM users WHERE id = ? LIMIT 1', [item.user_id]);
                // Get caseStatus
                const [caseStatus] = await pool.query('SELECT id, status, span_color, general FROM status_case WHERE id = ? LIMIT 1', [item.status_case_id]);

                let caseStatusData = null;
                if (caseStatus.length > 0) {
                    // Corregido el error en la asignación
                    caseStatusData = {
                        id: caseStatus[0].id,
                        name: caseStatus[0].status,
                        color: caseStatus[0].span_color,
                        general: caseStatus[0].general,
                    };
                }

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
                    caseStatus: caseStatusData,
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
        const [results] = await pool.query('SELECT * FROM vw_files_cases WHERE case_id = ? AND status = 1', [id]);

        if (results.length === 0) {
            res.status(200).json([]);
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
        const [organization] = await pool.query('SELECT id, country FROM countries WHERE id = ? LIMIT 1', [caseData.organization_id]);

        // Get doctor
        const [doctor] = await pool.query('SELECT id, fullname, email, customer_id FROM users WHERE id = ? LIMIT 1', [caseData.customer_id]);

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
            caseStatus: {
                id: caseStatus[0].id,
                name: caseStatus[0].status,
                color: caseStatus[0].span_color,
                general: caseStatus[0].general,
            },
            additionalInfo: caseData.observations,
            requireRevision: caseData.require_revision,
            orderNumber: caseData.order_number,
            viewerUrl: caseData.url_viewer,
            isDeleted: Boolean(caseData.is_deleted),
            treatmentType: {
                name: treatmentType[0].type_name,
                id: treatmentType[0].id
            },
            organization: {
                id: organization[0].id,
                name: organization[0].country,
                commonName: organization[0].country,
            },
            doctor: {
                id: doctor[0].id,
                fullName: doctor[0].fullname,
                customerId: doctor[0].customer_id
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

/**
 * Delete a case
 */

const deleteCase = async (req, res, next) => {
    const { id } = req.params;
    const user_id = req.user.id;

    try {
        const [result] = await pool.query('UPDATE cases SET is_deleted = 1, status_case_id = ? WHERE id = ?', [STATUS_CASE.CANCELLED, id]);

        if (result.affectedRows === 0) {
            return next(createError("Error, please try again later", ["Database connection error"], req.traceId, req.originalUrl));
        }

        // Guardar logs del sistema
        systemLogs(user_id, "Case deleted", id, MODULES.CASES);

        // Add row into recycler bin
        recyclerBin(id, MODULES.CASES, user_id);

        res.status(204).json();
    } catch (error) {
        next(error);
    }
}

// Delete file by id file
const deleteFile = async (req, res, next) => {
    const { id } = req.params;
    const user_id = req.user.id;

    try {
        const [results] = await pool.query('UPDATE files_cases SET status = 0 WHERE id = ? ', [id]);

        if (results.affectedRows === 0) {
            return next(createError("Error, please try again later", ["Database connection error"], req.traceId, req.originalUrl));
        }

        // Guardar logs del sistema
        systemLogs(user_id, "File deleted", id, MODULES.CASES);

        // Get url from file
        const [fileData] = await pool.query('SELECT url_file FROM files_cases WHERE id = ? LIMIT 1', [id]);
        // Get file name
        const URLFile = fileData[0].url_file;
        // Delete file from s3
        await deleteFileFromS3(URLFile);

        res.status(204).json();
    } catch (error) {
        next(error);
    }
}

/**
 * TODO Delete many cases
 */
const deleteManyCases = async (req, res, next) => {
    const { ids } = req.body;
    const user_id = req.user.id;

    try {
        const [result] = await pool.query('UPDATE cases SET is_deleted = 1, status_case_id = ? WHERE id IN (?)', [STATUS_CASE.CANCELLED, ids]);

        if (result.affectedRows === 0) {
            return next(createError("Error, please try again later", ["Database connection error"], req.traceId, req.originalUrl));
        }

        // Guardar logs del sistema
        ids.forEach((id) => {
            systemLogs(user_id, "Case deleted", id, MODULES.CASES);
            // Add row into recycler bin
            recyclerBin(id, MODULES.CASES, user_id);
        });

        res.status(200).json({ message: "Cases deleted successfully" });
    } catch (error) {
        next(error);
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
    getFilesCases,
    deleteCase,
    deleteManyCases,
    deleteFile, 
    updateCustomerIdFromCase
}