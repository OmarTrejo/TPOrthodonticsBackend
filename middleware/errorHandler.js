const errorHandler = (err, req, res, next) => {
  console.error(err);

  // Estructura base del error
  const errorResponse = {
    message: "", // Mensaje de error
    details: [], // Array de detalles (puede ser vacío o contener mensajes específicos)
    // status: 500, // Código de estado HTTP (por defecto 500)
    traceId: req.traceId || "", // Opcional: traceId para rastrear la solicitud
    url: req.originalUrl, // URL de la solicitud
  };

  // Manejo de error de duplicado
  if (err.code === "ER_DUP_ENTRY") {
    const field = err.sqlMessage.match(/for key '(.+?)'/)[1].split(".").pop();
    errorResponse.message = `The ${field} '${req.body[field]}' already exists. Please use a different one.`;
    // errorResponse.status = 400;
    errorResponse.details = [`Duplicate entry for field: ${field}`];
    return res.status(400).json(errorResponse);
  }

  // Manejo de error de campo nulo
  if (err.code === "ER_BAD_NULL_ERROR") {
    const field = err.sqlMessage.match(/column '(.*?)'/)[1];
    errorResponse.message = `The field '${field}' cannot be empty.`;
    // errorResponse.status = 400;
    errorResponse.details = [`Null value not allowed for field: ${field}`];
    return res.status(400).json(errorResponse);
  }

  // Manejo de error de datos demasiado largos
  if (err.code === "ER_DATA_TOO_LONG") {
    const field = err.sqlMessage.match(/column '(.*?)'/)[1];
    errorResponse.message = `The field '${field}' exceeds the maximum allowed length.`;
    // errorResponse.status = 400;
    errorResponse.details = [`Data too long for field: ${field}`];
    return res.status(400).json(errorResponse);
  }

  // Errores generales (internos del servidor)
  errorResponse.message = "An unexpected error occurred. Please try again later.";
  errorResponse.details = [err.message || "No additional details available."];
  // errorResponse.status = 500;

  return res.status(500).json(errorResponse);
};

module.exports = errorHandler;