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
            const filterConditions = Object.keys(filters).map((key) => {
                if (key === 'is_deleted') {
                    // Si el filtro es "is_deleted", usar el operador =
                    filterValues.push(filters[key]);
                    return `${key} = ?`;
                } else {
                    // Para otros filtros, usar LIKE con comodines %
                    filterValues.push(`%${filters[key]}%`);
                    return `${key} LIKE ?`;
                }
            });

            // Construir la cláusula WHERE
            if (filters.hasOwnProperty('is_deleted')) {
                // Si existe el filtro is_deleted, agregarlo al inicio
                whereClause = ` WHERE is_deleted = ? AND (${filterConditions.filter(cond => !cond.startsWith('is_deleted')).join(' OR ')})`;
            } else {
                // Si no existe el filtro is_deleted, solo usar los demás filtros
                whereClause = ` WHERE ${filterConditions.join(' OR ')}`;
            }
        }

        console.log(whereClause);

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
}

module.exports = { paginateQuery };