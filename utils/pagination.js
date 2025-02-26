const pool = require('../database/config');

const paginateQuery = async (baseQuery, countQuery, filters, page, pageSize) => {
    try {
        // Validar parámetros de paginación
        if (page < 1 || pageSize < 1) {
            throw new Error('Los parámetros page y pageSize deben ser mayores a 0');
        }

        // Calcular el OFFSET
        const offset = (page - 1) * pageSize;

        let whereClause = '';
        const filterValues = [];

        if (filters && Object.keys(filters).length > 0) {
            const filterConditions = [];

            // Agregar el filtro para excluir al usuario logueado (si existe)
            if (filters.user_id) {
                filterConditions.push('id != ?');
                filterValues.push(filters.user_id);
            }

            // Agregar otros filtros dinámicos
            Object.keys(filters).forEach((key) => {
                if (key !== 'user_id') { // Evitar procesar user_id nuevamente
                    if (key === 'is_deleted') {
                        filterConditions.push(`${key} = ?`);
                        filterValues.push(filters[key]);
                    } else {
                        filterConditions.push(`${key} LIKE ?`);
                        filterValues.push(`%${filters[key]}%`);
                    }
                }
            });

            // Construir la cláusula WHERE
            if (filterConditions.length > 0) {
                whereClause = ` WHERE ${filterConditions.join(' AND ')}`;
            }
        }

        console.log(`${baseQuery}${whereClause} LIMIT ? OFFSET ?`, [...filterValues, pageSize, offset]);

        // Obtener los datos paginados
        const [rows] = await pool.query(
            `${baseQuery}${whereClause} LIMIT ? OFFSET ?`,
            [...filterValues, pageSize, offset]
        );

        // Obtener el número total de filas
        const [totalRows] = await pool.query(
            `${countQuery}${whereClause}`,
            filterValues
        );
        const total = totalRows[0].total;

        // Calcular el número total de páginas
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

module.exports = { paginateQuery };