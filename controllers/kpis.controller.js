const { ROLES_USER, STATUS_CASE } = require('../utils/constants');
const createError = require('../utils/createError');
const pool = require("../database/config");

/**
 * TODO Get KPI´s from databases and cases
 * @param {*} res 
 * @param {*} res 
 * @param {*} next 
 */

const getKPIs = async (req, res, next) => {
    const user_id = req.user.id;
    const periodicity = parseInt(req.query.periodicity);
    // console.log(typeof(periodicity))
    // Last 7, this month, this year
    // 1. This year
    // 2. This month
    // 3. This last 7 days

    let periodicity_name = ""; 

    if(periodicity === 1) 
    {
        periodicity_name = "this year";
    }
    else if(periodicity === 2)
    {
        periodicity_name = "this month";
    }
    else if(periodicity === 3)
    {
        periodicity_name = "in the last 7 days";
    }
    else
    {
        periodicity_name = "this year";
    }

    try {
        const [users] = await pool.query('SELECT role_id FROM users WHERE id = ?', [user_id]);

        if (users.length === 0) {
            return next(createError("Error, please try again later", ["Database connection error"], req.traceId, req.originalUrl));
        }

        const user = users[0];

        let response = [];

        if (user.role_id === ROLES_USER.ADMIN) {

            // KPI 2 Opened
            const kpi2 = await getNumberOfCasesOpened(periodicity);
            const indicator2 = kpi2 > 10 ? "bad" : (kpi2 < 2 ? "neutral" : "good");

            // KPI 3 Unnasigned
            const kpi3 = await getNumberOfCasesUnnasigned(periodicity);
            const indicator3 = kpi2 > 10 ? "bad" : (kpi2 < 2 ? "neutral" : "good");
            
            // KPI 4 DELETED
            const kpi4 = await getNumberOfCasesDELETED(periodicity);
            const indicator4 = kpi2 > 10 ? "good" : (kpi2 < 2 ? "bad" : "neutral");
            
            response = [
                {
                    title: `Cases opened ${periodicity_name}`,
                    description: `Number of cases opened`,
                    value: kpi2,
                    indicator: indicator2, // good, bad, or neutral
                    statusId: 0
                },
                {
                    title: `Cases unnasigned ${periodicity_name}`,
                    description: `Number of cases not assidned to tech `,
                    value: kpi3,
                    indicator: indicator3, // good, bad, or neutral
                    statusId: STATUS_CASE.UNNASIGNED
                },
                {
                    title: `Cases DELETED ${periodicity_name}`,
                    description: "Number of cases are DELETED",
                    value: kpi4,
                    indicator: indicator4, // good, bad, or neutral
                    statusId: STATUS_CASE.DELETED
                }
            ];
        } else if (user.role_id === ROLES_USER.TECH) {
            // KPI 1 Total
            const kpi1 = await getNumberOfCasesAssignedTech(periodicity, user_id);
            const indicator1 = "neutral";

            // KPI 2 Opened
            const kpi2 = await getNumberOfCasesDELETEDTech(periodicity, user_id);
            const indicator2 = kpi2 > 10 ? "bad" : (kpi2 < 2 ? "neutral" : "good");
            
            response = [
                {
                    title: `Cases assigned ${periodicity_name}`,
                    description: `Number of cases assigned`,
                    value: kpi1,
                    indicator: indicator1, // good, bad, or neutral
                    statusId: 0
                },
                {
                    title: `Cases DELETED ${periodicity_name}`,
                    description: `Number of cases DELETED`,
                    value: kpi2,
                    indicator: indicator2, // good, bad, or neutral
                    statusId: STATUS_CASE.DELETED
                }
            ];
        } else if (user.role_id === ROLES_USER.DOCTOR) {
            // KPI 2 Opened
            const kpi2 = await getNumberOfCasesOpenedDoctor(periodicity, user_id);
            const indicator2 = kpi2 > 10 ? "bad" : (kpi2 < 2 ? "neutral" : "good");

            // KPI 3 Unnasigned
            const kpi3 = await getNumberOfCasesUnnasignedDoctor(periodicity, user_id);
            const indicator3 = kpi2 > 10 ? "bad" : (kpi2 < 2 ? "neutral" : "good");
            
            // KPI 4 DELETED
            const kpi4 = await getNumberOfCasesDELETEDDoctor(periodicity, user_id);
            const indicator4 = kpi2 > 10 ? "good" : (kpi2 < 2 ? "bad" : "neutral");
            
            response = [
                {
                    title: `Cases opened ${periodicity_name}`,
                    description: `Number of cases opened`,
                    value: kpi2,
                    indicator: indicator2, // good, bad, or neutral
                    statusId: 0
                },
                {
                    title: `Cases unnasigned ${periodicity_name}`,
                    description: `Number of cases not assidned to tech `,
                    value: kpi3,
                    indicator: indicator3,// good, bad, or neutral
                    statusId: STATUS_CASE.UNNASIGNED
                },
                {
                    title: `Cases DELETED ${periodicity_name}`,
                    description: "Number of cases are DELETED",
                    value: kpi4,
                    indicator: indicator4, // good, bad, or neutral
                    statusId: STATUS_CASE.DELETED
                }
            ];
        } else {
            // It's a Support role (Assistant)
            // KPI 1 Total
            const kpi1 = await getTotalAccessRequests(periodicity, user_id);
            const indicator1 = kpi1 > 3 ? "good" : (kpi1 < 3 ? "bad" : "neutral");

            // KPI 2 Opened
            const kpi2 = await getTotalAccessRequestsApproved(periodicity, user_id);
            const indicator2 = kpi2 > 10 ? "bad" : (kpi2 < 2 ? "neutral" : "good");

            // KPI 3 Unnasigned
            const kpi3 = await ggetTotalAccessRequestsDenied(periodicity, user_id);
            const indicator3 = kpi2 > 10 ? "bad" : (kpi2 < 2 ? "neutral" : "good");
                        
            response = [
                {
                    title: `Total request ${periodicity_name}`,
                    description: `Number of access requests`,
                    value: kpi1,
                    indicator: indicator1 // good, bad, or neutral
                },
                {
                    title: `Accepted requests ${periodicity_name}`,
                    description: `Number of access requests approve`,
                    value: kpi2,
                    indicator: indicator2 // good, bad, or neutral
                },
                {
                    title: `Denied requests ${periodicity_name}`,
                    description: `Number of access requests deny`,
                    value: kpi3,
                    indicator: indicator3 // good, bad, or neutral
                }
            ];
        }

        // Filtrar KPIs para evitar duplicados o datos innecesarios
        const filteredResponse = response.filter(kpi => kpi.value !== undefined);

        res.status(200).json(filteredResponse);
    } catch (error) {
        next(error)
    }
}

/**
 * TODO Get KPI´s from databases and cases TO ADMIN
 * @param {*} periodicity 
 * @returns 
 */
const getNumberOfCases = async (periodicity) => {
    let query = `
        SELECT COUNT(*) AS count
        FROM cases
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)
    `;

    if (periodicity === 2) {
        query = `
            SELECT COUNT(*) AS count
            FROM cases
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
        `;
    } else if (periodicity === 3) {
        query = `
            SELECT COUNT(*) AS count
            FROM cases
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        `;
    }

    const [result] = await pool.query(query);
    return result[0].count;
}
const getNumberOfCasesOpened = async (periodicity) => {
    let query = `
        SELECT COUNT(*) AS count
        FROM cases
        WHERE status_case_id <> ${STATUS_CASE.UNNASIGNED} AND status_case_id <> ${STATUS_CASE.CANCELLED} AND status_case_id <> ${STATUS_CASE.DELETED} AND created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)
    `;

    if (periodicity === 2) {
        query = `
            SELECT COUNT(*) AS count
            FROM cases
            WHERE status_case_id <> ${STATUS_CASE.UNNASIGNED} AND status_case_id <> ${STATUS_CASE.CANCELLED} AND status_case_id <> ${STATUS_CASE.DELETED} AND created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
        `;
    } else if (periodicity === 3) {
        query = `
            SELECT COUNT(*) AS count
            FROM cases
            WHERE status_case_id <> ${STATUS_CASE.UNNASIGNED} AND status_case_id <> ${STATUS_CASE.CANCELLED} AND status_case_id <> ${STATUS_CASE.DELETED} AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        `;
    }

    console.log(query)
    const [result] = await pool.query(query);
    return result[0].count;
}
const getNumberOfCasesUnnasigned = async (periodicity) => {
    let query = `
        SELECT COUNT(*) AS count
        FROM cases
        WHERE status_case_id = ${STATUS_CASE.UNNASIGNED} AND created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)
    `;

    if (periodicity === 2) {
        query = `
            SELECT COUNT(*) AS count
            FROM cases
            WHERE status_case_id = ${STATUS_CASE.UNNASIGNED} AND created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
        `;
    } else if (periodicity === 3) {
        query = `
            SELECT COUNT(*) AS count
            FROM cases
            WHERE status_case_id = ${STATUS_CASE.UNNASIGNED} AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        `;
    }
    console.log(query)
    const [result] = await pool.query(query);
    return result[0].count;
}
const getNumberOfCasesDELETED = async (periodicity) => {
    let query = `
        SELECT COUNT(*) AS count
        FROM cases
        WHERE status_case_id = ${STATUS_CASE.DELETED} AND created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)
    `;

    if (periodicity === 2) {
        query = `
            SELECT COUNT(*) AS count
            FROM cases
            WHERE status_case_id = ${STATUS_CASE.DELETED} AND created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
        `;
    } else if (periodicity === 3) {
        query = `
            SELECT COUNT(*) AS count
            FROM cases
            WHERE status_case_id = ${STATUS_CASE.DELETED} AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        `;
    }
console.log(query)
    const [result] = await pool.query(query);
    return result[0].count;
}

/**
 * TODO funcitons to tech
 * @param {*} periodicity 
 * @param {*} id 
 * @returns 
 */
const getNumberOfCasesDELETEDTech = async (periodicity, id) => {
    let query = `
        SELECT COUNT(*) AS count
        FROM cases
        WHERE status_case_id = ${STATUS_CASE.DELETED} AND tech_id = ${id} AND created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)
    `;

    if (periodicity === 2) {
        query = `
            SELECT COUNT(*) AS count
            FROM cases
            WHERE status_case_id = ${STATUS_CASE.DELETED} AND tech_id = ${id} AND created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
        `;
    } else if (periodicity === 3) {
        query = `
            SELECT COUNT(*) AS count
            FROM cases
            WHERE status_case_id = ${STATUS_CASE.DELETED} AND tech_id = ${id} AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        `;
    }

    const [result] = await pool.query(query);
    return result[0].count;
}
const getNumberOfCasesAssignedTech = async (periodicity, id) => {
    let query = `
        SELECT COUNT(*) AS count
        FROM cases
        WHERE status_case_id != ${STATUS_CASE.UNNASIGNED} AND tech_id = ${id} AND created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)
    `;

    if (periodicity === 2) {
        query = `
            SELECT COUNT(*) AS count
            FROM cases
            WHERE status_case_id != ${STATUS_CASE.UNNASIGNED} AND tech_id = ${id} AND created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
        `;
    } else if (periodicity === 3) {
        query = `
            SELECT COUNT(*) AS count
            FROM cases
            WHERE status_case_id != ${STATUS_CASE.UNNASIGNED} AND tech_id = ${id} AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        `;
    }

    const [result] = await pool.query(query);
    return result[0].count;
}

/**
 * TODO functions to Doctor
 */

const getNumberOfCasesDoctor = async (periodicity, id) => {
    let query = `
        SELECT COUNT(*) AS count
        FROM cases
        WHERE customer_id = ${id} AND created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)
    `;

    if (periodicity === 2) {
        query = `
            SELECT COUNT(*) AS count
            FROM cases
            WHERE customer_id = ${id} AND  created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
        `;
    } else if (periodicity === 3) {
        query = `
            SELECT COUNT(*) AS count
            FROM cases
            WHERE customer_id = ${id} AND  created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        `;
    }

    const [result] = await pool.query(query);
    return result[0].count;
}
const getNumberOfCasesOpenedDoctor = async (periodicity, id) => {
    let query = `
        SELECT COUNT(*) AS count
        FROM cases
        WHERE status_case_id <> ${STATUS_CASE.UNNASIGNED} AND status_case_id <> ${STATUS_CASE.CANCELLED} AND status_case_id <> ${STATUS_CASE.DELETED} AND customer_id = ${id} AND created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)
    `;

    if (periodicity === 2) {
        query = `
            SELECT COUNT(*) AS count
            FROM cases
            WHERE status_case_id <> ${STATUS_CASE.UNNASIGNED} AND status_case_id <> ${STATUS_CASE.CANCELLED} AND status_case_id <> ${STATUS_CASE.DELETED} AND customer_id = ${id} AND created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
        `;
    } else if (periodicity === 3) {
        query = `
            SELECT COUNT(*) AS count
            FROM cases
            WHERE status_case_id <> ${STATUS_CASE.UNNASIGNED} AND status_case_id <> ${STATUS_CASE.CANCELLED} AND status_case_id <> ${STATUS_CASE.DELETED} AND customer_id = ${id} AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        `;
    }

    const [result] = await pool.query(query);
    return result[0].count;
}
const getNumberOfCasesUnnasignedDoctor = async (periodicity, id) => {
    let query = `
        SELECT COUNT(*) AS count
        FROM cases
        WHERE customer_id = ${id} AND status_case_id = ${STATUS_CASE.UNNASIGNED} AND created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)
    `;

    if (periodicity === 2) {
        query = `
            SELECT COUNT(*) AS count
            FROM cases
            WHERE customer_id = ${id} AND status_case_id = ${STATUS_CASE.UNNASIGNED} AND created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
        `;
    } else if (periodicity === 3) {
        query = `
            SELECT COUNT(*) AS count
            FROM cases
            WHERE customer_id = ${id} AND status_case_id = ${STATUS_CASE.UNNASIGNED} AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        `;
    }

    const [result] = await pool.query(query);
    return result[0].count;
}
const getNumberOfCasesDELETEDDoctor = async (periodicity, id) => {
    let query = `
        SELECT COUNT(*) AS count
        FROM cases
        WHERE customer_id = ${id} AND status_case_id = ${STATUS_CASE.DELETED} AND created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)
    `;

    if (periodicity === 2) {
        query = `
            SELECT COUNT(*) AS count
            FROM cases
            WHERE customer_id = ${id} AND status_case_id = ${STATUS_CASE.DELETED} AND created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
        `;
    } else if (periodicity === 3) {
        query = `
            SELECT COUNT(*) AS count
            FROM cases
            WHERE customer_id = ${id} AND status_case_id = ${STATUS_CASE.DELETED} AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        `;
    }

    const [result] = await pool.query(query);
    return result[0].count;
}

/**
 * TODO Functions to support role
 */
const getTotalAccessRequests= async (periodicity, id) => {
    let query = `
        SELECT COUNT(*) AS count
        FROM request_user
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)
    `;

    if (periodicity === 2) {
        query = `
            SELECT COUNT(*) AS count
            FROM request_user
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
        `;
    } else if (periodicity === 3) {
        query = `
            SELECT COUNT(*) AS count
            FROM request_user
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        `;
    }
    const [result] = await pool.query(query);
    return result[0].count;

}

const getTotalAccessRequestsApproved = async (periodicity, id) => {
    let query = `
        SELECT COUNT(*) AS count
        FROM logs_system
        WHERE user_id = ${id} AND action like '%Requests access has been approved%' AND created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)
    `;

    if (periodicity === 2) {
        query = `
            SELECT COUNT(*) AS count
            FROM logs_system
            WHERE user_id = ${id} AND action like '%Requests access has been approved%' AND created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
        `;
    } else if (periodicity === 3) {
        query = `
            SELECT COUNT(*) AS count
            FROM logs_system
            WHERE user_id = ${id} AND action like '%Requests access has been approved%' AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        `;
    }

    const [result] = await pool.query(query);
    return result[0].count;

}

const ggetTotalAccessRequestsDenied= async (periodicity, id) => {
    let query = `
        SELECT COUNT(*) AS count
        FROM logs_system
        WHERE user_id = ${id} AND action like '%Request Access has been denied%' AND created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)
    `;

    if (periodicity === 2) {
        query = `
            SELECT COUNT(*) AS count
            FROM logs_system
            WHERE user_id = ${id} AND action like '%Request Access has been denied%' AND created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
        `;
    } else if (periodicity === 3) {
        query = `
            SELECT COUNT(*) AS count
            FROM logs_system
            WHERE user_id = ${id} AND action like '%Request Access has been denied%' AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        `;
    }

    const [result] = await pool.query(query);
    return result[0].count;

}
module.exports = {
    getKPIs
}