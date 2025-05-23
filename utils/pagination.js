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
        
        let strictConditions = [];  // Para filtros exactos (AND)
        let flexibleConditions = []; // Para filtros flexibles (OR)
        let filterValuesStrict = [];
        let filterValuesFlexible = [];

        if (filters && Object.keys(filters).length > 0) {
            if (filters.excludeStatuses) {
                const placeholders = filters.excludeStatuses.map(() => '?').join(', ');
                strictConditions.push(`status_case_id NOT IN (${placeholders})`);
                filterValuesStrict.push(...filters.excludeStatuses);
                delete filters.excludeStatuses;
            }

            if (filters.hasOwnProperty('is_deleted')) {
                strictConditions.push("is_deleted = ?");
                filterValuesStrict.push(filters.is_deleted);
            }
            if (filters.hasOwnProperty('seen')) {
                strictConditions.push("seen = ?");
                filterValuesStrict.push(filters.seen);
            }
            if (filters.hasOwnProperty('userId')) {
                strictConditions.push("userId != ?");
                filterValuesStrict.push(filters.userId);
            }

            if (filters.excludeStatuses) {
                const placeholders = filters.excludeStatuses.map(() => '?').join(', ');
                strictConditions.push(`status_case_id NOT IN (${placeholders})`);
                filterValuesStrict.push(...filters.excludeStatuses);
                delete filters.excludeStatuses;
            }

            if (filters.status_case_id !== undefined) {
                strictConditions.push('status_case_id = ?');
                filterValuesStrict.push(filters.status_case_id);
                delete filters.status_case_id;
            }

            // Aquí iteramos todos los filtros restantes para flexibleConditions
            Object.keys(filters).forEach((key) => {
                // Excluir las keys ya manejadas como estrictas
                if (key !== 'is_deleted' && key !== 'userId' && key !== 'seen' && key !== 'excludeStatuses') {
                    // Caso especial para created_at_from
                    if (key === 'created_at_from') {
                        flexibleConditions.push(`created_at >= ?`);
                        filterValuesFlexible.push(filters[key]);
                    } else {
                        // El resto usan LIKE
                        flexibleConditions.push(`${key} LIKE ?`);
                        filterValuesFlexible.push(`%${filters[key]}%`);
                    }
                }
            });

            if (strictConditions.length > 0 && flexibleConditions.length > 0) {
                whereClause = ` WHERE (${strictConditions.join(' AND ')}) AND (${flexibleConditions.join(' OR ')})`;
            } else if (strictConditions.length > 0) {
                whereClause = ` WHERE ${strictConditions.join(' AND ')}`;
            } else if (flexibleConditions.length > 0) {
                whereClause = ` WHERE ${flexibleConditions.join(' OR ')}`;
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

        const finalFilterValues = [...filterValuesStrict, ...filterValuesFlexible, pageSize, offset];

        console.log(`${baseQuery}${whereClause}${orderByClause} LIMIT ? OFFSET ?`, finalFilterValues);

        const [rows] = await pool.query(
            `${baseQuery}${whereClause}${orderByClause} LIMIT ? OFFSET ?`,
            finalFilterValues
        );

        const [totalRows] = await pool.query(
            `${countQuery}${whereClause}`,
            [...filterValuesStrict, ...filterValuesFlexible]
        );

        const total = totalRows[0]?.total || 0;
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
};



// const paginateQuery = async (baseQuery, countQuery, filters, page, pageSize, orderBy = {}, periodicity) => {
//     try {
//         if (page < 1 || pageSize < 1) {
//             throw new Error('Los parámetros page y pageSize deben ser mayores a 0');
//         }

//         const offset = (page - 1) * pageSize;
//         let whereClause = '';
        
//         // Arreglos separados para AND y OR
//         let strictConditions = [];  // Para `is_deleted` y `userId`
//         let flexibleConditions = []; // Para los demás filtros
//         let filterValuesStrict = [];
//         let filterValuesFlexible = [];

//         if (filters && Object.keys(filters).length > 0) {
//             if (filters.hasOwnProperty('is_deleted')) {
//                 strictConditions.push("is_deleted = ?");
//                 filterValuesStrict.push(filters.is_deleted);
//             }
//             if (filters.hasOwnProperty('seen')) {
//                 strictConditions.push("seen = ?");
//                 filterValuesStrict.push(filters.seen);
//             }
//             if (filters.hasOwnProperty('userId')) {
//                 strictConditions.push("userId != ?");
//                 filterValuesStrict.push(filters.userId);
//             }

//             Object.keys(filters).forEach((key) => {
//                 if (key !== 'is_deleted' && key !== 'userId' && key !== 'seen') {
//                     flexibleConditions.push(`${key} LIKE ?`);
//                     filterValuesFlexible.push(`%${filters[key]}%`);
//                 }
//             });

//             if (strictConditions.length > 0 && flexibleConditions.length > 0) {
//                 whereClause = ` WHERE (${strictConditions.join(' AND ')}) AND (${flexibleConditions.join(' OR ')})`;
//             } else if (strictConditions.length > 0) {
//                 whereClause = ` WHERE ${strictConditions.join(' AND ')}`;
//             } else if (flexibleConditions.length > 0) {
//                 whereClause = ` WHERE ${flexibleConditions.join(' OR ')}`;
//             }
//         }

//         let orderByClause = '';
//         if (orderBy.column && orderBy.direction) {
//             const validDirections = ['ASC', 'DESC'];
//             if (!validDirections.includes(orderBy.direction.toUpperCase())) {
//                 throw new Error('La dirección del orden debe ser "ASC" o "DESC"');
//             }
//             orderByClause = ` ORDER BY ${orderBy.column} ${orderBy.direction}`;
//         }

//         // Se concatenan los valores en el orden correcto
//         const finalFilterValues = [...filterValuesStrict, ...filterValuesFlexible, pageSize, offset];

//         console.log(`${baseQuery}${whereClause}${orderByClause} LIMIT ? OFFSET ?`, finalFilterValues);

//         const [rows] = await pool.query(
//             `${baseQuery}${whereClause}${orderByClause} LIMIT ? OFFSET ?`,
//             finalFilterValues
//         );

//         const [totalRows] = await pool.query(
//             `${countQuery}${whereClause}`,
//             [...filterValuesStrict, ...filterValuesFlexible]
//         );

//         const total = totalRows[0]?.total || 0;
//         const pageCount = Math.ceil(total / pageSize);

//         return {
//             currentPage: page,
//             rowCount: total,
//             pageCount: pageCount,
//             results: rows,
//         };

//     } catch (error) {
//         throw error;
//     }
// };


module.exports = { paginateQuery };
