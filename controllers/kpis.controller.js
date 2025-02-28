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
    const periodicity = req.query.periodicity;

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
        periodicity_name = "last 7 days";
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

            // KPI 1 Total
            const kpi1 = await getNumberOfCases(periodicity);
            const indicator1 = kpi1 > 3 ? "good" : (kpi1 < 3 ? "bad" : "neutral");

            // KPI 2 Opened
            const kpi2 = await getNumberOfCasesOpened(periodicity);
            const indicator2 = kpi2 > 10 ? "bad" : (kpi2 < 2 ? "neutral" : "good");

            // KPI 3 Unnasigned
            const kpi3 = await getNumberOfCasesUnnasigned(periodicity);
            const indicator3 = kpi2 > 10 ? "bad" : (kpi2 < 2 ? "neutral" : "good");
            
            // KPI 3 Closed
            const kpi4 = await getNumberOfCasesClosed(periodicity);
            const indicator4 = kpi2 > 10 ? "good" : (kpi2 < 2 ? "bad" : "neutral");
            
            response = [
                {
                    title: `Cases created ${periodicity_name}`,
                    description: `Number of cases register`,
                    value: kpi1,
                    indicator: indicator1 // good, bad, or neutral
                },
                {
                    title: `Cases opened ${periodicity_name}`,
                    description: `Number of cases opened`,
                    value: kpi2,
                    indicator: indicator2 // good, bad, or neutral
                },
                {
                    title: `Cases unnasigned ${periodicity_name}`,
                    description: `Number of cases not assidned to tech `,
                    value: kpi3,
                    indicator: indicator3 // good, bad, or neutral
                },
                {
                    title: `Tickets closed ${periodicity_name}`,
                    description: "Number of cases are closed",
                    value: kpi4,
                    indicator: indicator4 // good, bad, or neutral
                }
            ];
        } else if (user.role_id === ROLES_USER.TECH) {
            response = [
                {
                    title: `Tickets Assigned ${periodicity}`,
                    description: "Number of tickets assigned to you",
                    value: 0,
                    indicator: "neutral",
                    link: "/my-tickets"
                },
                {
                    id: 2,
                    name: "Tickets Closed",
                    value: 0,
                    icon: "fa-solid fa-check",
                    color: "text-success",
                    link: "/my-tickets"
                },
                {
                    id: 3,
                    name: "SLA Compliance",
                    value: "0%",
                    icon: "fa-solid fa-clock",
                    color: "text-warning",
                    link: "/reports"
                }
            ];
        } else if (user.role_id === ROLES_USER.DOCTOR) {
            response = [
                {
                    title: "My Open Tickets",
                    description: "Number of active tickets",
                    value: 0,
                    indicator: "neutral",
                    link: "/my-tickets"
                },
                {
                    id: 2,
                    name: "Average First Response Time",
                    value: "0h",
                    icon: "fa-solid fa-stopwatch",
                    color: "text-info",
                    link: "/reports"
                },
                {
                    id: 3,
                    name: "Service Satisfaction",
                    value: "0/5",
                    icon: "fa-solid fa-star",
                    color: "text-warning",
                    link: "/feedback"
                }
            ];
        } else {
            // It's a Support role (Assistant)
            response = [
                {
                    title: "Requests Reviewed",
                    description: "Requests accepted or rejected today",
                    value: 0,
                    indicator: "neutral",
                    link: "/requests"
                },
                {
                    id: 2,
                    name: "Validation Time",
                    value: "0 min",
                    icon: "fa-solid fa-hourglass-half",
                    color: "text-primary",
                    link: "/reports"
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
        WHERE status_case_id <> ${STATUS_CASE.UNNASIGNED} AND status_case_id <> ${STATUS_CASE.CANCELLED} AND status_case_id <> ${STATUS_CASE.CLOSED} AND created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)
    `;

    if (periodicity === 2) {
        query = `
            SELECT COUNT(*) AS count
            FROM cases
            WHERE status_case_id <> ${STATUS_CASE.UNNASIGNED} AND status_case_id <> ${STATUS_CASE.CANCELLED} AND status_case_id <> ${STATUS_CASE.CLOSED} AND created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
        `;
    } else if (periodicity === 3) {
        query = `
            SELECT COUNT(*) AS count
            FROM cases
            WHERE status_case_id <> ${STATUS_CASE.UNNASIGNED} AND status_case_id <> ${STATUS_CASE.CANCELLED} AND status_case_id <> ${STATUS_CASE.CLOSED} AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        `;
    }

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

    const [result] = await pool.query(query);
    return result[0].count;
}
const getNumberOfCasesClosed = async (periodicity) => {
    let query = `
        SELECT COUNT(*) AS count
        FROM cases
        WHERE status_case_id = ${STATUS_CASE.CLOSED} AND created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)
    `;

    if (periodicity === 2) {
        query = `
            SELECT COUNT(*) AS count
            FROM cases
            WHERE status_case_id = ${STATUS_CASE.CLOSED} AND created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
        `;
    } else if (periodicity === 3) {
        query = `
            SELECT COUNT(*) AS count
            FROM cases
            WHERE status_case_id = ${STATUS_CASE.CLOSED} AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        `;
    }

    const [result] = await pool.query(query);
    return result[0].count;
}


module.exports = {
    getKPIs
}