const pool = require('../database/config');

const paginateQuery = async (baseQuery, countQuery, filters, page, pageSize) => {
    try
    {
        // Validar parámetros de paginación
        if (page < 1 || pageSize < 1) {
            throw new Error('Los parámetros page y pageSize deben ser mayores a 0');
        }

        // Calcular el OFFSET
        const offset = (page - 1) * pageSize;

        // Construir la cláusula WHERE dinámicamente
        let whereClause = '';
        const filterValues = [];
        if (filters && Object.keys(filters).length > 0) {
            const filterConditions = Object.keys(filters).map((key) => {
                filterValues.push(filters[key]);
                return `${key} LIKE ?`;
            });
            whereClause = ` WHERE ${filterConditions.join(' OR ')}`;
        }

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

    }catch(error){
        throw error;
    }
}

module.exports = { paginateQuery };