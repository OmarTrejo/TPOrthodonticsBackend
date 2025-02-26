const { formattedDate } = require("../utils/dates");
const { paginateQuery } = require('../utils/pagination');
const pool = require('../database/config');
const { STATUS_CASE } = require("../utils/constants");
/**
 * TODO Get all cases for role
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
const getAllCases = async (req, res, next) => 
{
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
            const [caseStatus] = await pool.query('SELECT id, status, span_color FROM status_case WHERE id = ? LIMIT 1', [item.status_case_id]);

            // Get organization
            const [organization] = await pool.query('SELECT id, name FROM dc WHERE id = ? LIMIT 1', [item.organization_id]);

            // Get doctor
            const [doctor] = await pool.query('SELECT id, fullname, email FROM users WHERE id = ? LIMIT 1', [item.customer_id]);

            // Validated if have a tech assigned
            if(!item.tech_id){
                const [tech] = await pool.query('SELECT id, fullname, email FROM users WHERE id = ? LIMIT 1', [item.tech_id]);
            }
            
            // Get tech
            const tech = { id: null, fullname: null, email: null };

            return {
                id: item.id,
                name: item.name,
                patientName: item.patient_name,
                caseStatus,
                additionalInfo: item.observations,
                generalComments: item.general_comments,
                technicalSpecifications: item.tech_observations,
                orderNumber: item.order_number,
                viewerUrl: item.url_viewer,
                isDeleted: Boolean(item.is_deleted),
                treatmentType,
                organization,
                doctor,
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

const createCase = async (req, res, next) =>
{
    const { name, patientName, additionalInfo, generalComments, technicalSpecifications, attachmentFormName, attachmentFormExtension, attachmentFormBase64, treatmentTypeId  } = req.body;
    const user_id = req.user.id; // Doctor

    try {

        // Get user
        const [user] = await pool.query('SELECT * FROM users WHERE id = ? LIMIT 1', [user_id]);

        const [caseCreated] = await pool.query('INSERT INTO cases (name, patient_name, observations, general_comments, tech_observations,  treatment_type_id, customer_id, status_case_id, organization_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [name, patientName, additionalInfo, generalComments, technicalSpecifications, treatmentTypeId, user_id, STATUS_CASE.UNNASIGNED, user[0].dc_id]);

        if (result.affectedRows === 0) {
            const error = createError(
                "Error, please try again later", // Mensaje de error
                ["Error connection to database"], // Detalles
                req.traceId, // TraceId (si lo tienes)
                req.originalUrl // URL de la solicitud
            );
            return next(error); // Pasa el error al middleware de manejo de errores
        }

        // Save a logs
        systemLogs(user_id, "New row inserted", result.insertId, MODULES.COUNTRIES)

        res.status(201).json({message: 'Create case successfully'});

        
    } catch (error) {
        next(error)
    }
}

module.exports = {
    getAllCases,
    createCase
}