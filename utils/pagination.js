const pool = require('../database/config');

const paginateQuery = async (baseQuery, countQuery, queryParams, page, pageSize) => {
    try
    {
        // Validar parámetros de paginación
        if (page < 1 || pageSize < 1) {
            throw new Error('Los parámetros page y pageSize deben ser mayores a 0');
        }

        // Calcular el OFFSET
        const offset = (page - 1) * pageSize;

        // Obtener los datos paginados
        const [rows] = await pool.query(
            `${baseQuery} LIMIT ? OFFSET ?`,
            [...queryParams, pageSize, offset]
        );

        // Obtener el número total de filas
        const [totalRows] = await pool.query(countQuery, queryParams);
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