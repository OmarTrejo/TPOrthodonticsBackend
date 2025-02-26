const pool = require('../database/config');

/**
 * TODO create a pagination from a query 
 * @param {*} baseQuery 
 * @param {*} countQuery 
 * @param {*} filters 
 * @param {*} page 
 * @param {*} pageSize 
 * @param {*} orderBy 
 * @returns 
 */

const paginateQuery = async (baseQuery, countQuery, filters, page, pageSize, orderBy = {}) => {
    try {
        if (page < 1 || pageSize < 1) {
            throw new Error('Los parámetros page y pageSize deben ser mayores a 0');
        }

        const offset = (page - 1) * pageSize;
        let whereClause = '';
        const filterValues = [];

        if (filters && Object.keys(filters).length > 0) {
            const filterConditions = Object.keys(filters).map((key) => {
                if (key === 'is_deleted') {
                    filterValues.push(filters[key]);
                    return `${key} = ?`;
                } else if (key === 'id') {
                    // Si el filtro incluye user_id, excluimos ese usuario
                    filterValues.push(filters[key]);
                    return `${key} != ?`;
                } else {
                    filterValues.push(`%${filters[key]}%`);
                    return `${key} LIKE ?`;
                }
            });

            if (filters.hasOwnProperty('is_deleted')) {
                const otherConditions = filterConditions.filter(cond => !cond.startsWith('is_deleted'));

                if (otherConditions.length > 0) {
                    whereClause = ` WHERE is_deleted = ? AND (${otherConditions.join(' OR ')})`;
                } else {
                    whereClause = ` WHERE is_deleted = ?`;
                }
            } else {
                whereClause = ` WHERE ${filterConditions.join(' OR ')}`;
            }
        }

        let orderByClause = '';
        if (orderBy.column && orderBy.direction) {
            const validDirections = ['ASC', 'DESC'];
            if (!validDirections.includes(orderBy.direction.toUpperCase())) {
                throw new Error('La dirección del orden debe ser "ASC" o "DESC"');
            }
            orderByClause = ` ORDER BY ${orderBy.column} ${orderBy.direction}`;
        }

        console.log(`${baseQuery}${whereClause}${orderByClause} LIMIT ? OFFSET ?`, [...filterValues, pageSize, offset]);

        const [rows] = await pool.query(
            `${baseQuery}${whereClause}${orderByClause} LIMIT ? OFFSET ?`,
            [...filterValues, pageSize, offset]
        );

        const [totalRows] = await pool.query(
            `${countQuery}${whereClause}`,
            filterValues
        );
        const total = totalRows[0].total;

        const pageCount = Math.ceil(total / pageSize);

        return {
            currentPage: page,
            rowCount: total,
            pageCount: pageCount,
            results: rows,
        };

    } catch (error) {
        throw error;
    }
}

module.exports = { paginateQuery };
