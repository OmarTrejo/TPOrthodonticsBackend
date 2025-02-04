const errorHandler = (err, req, res, next) => {
  console.error(err); 
  
  // Manejo de error de duplicado
  if (err.code === "ER_DUP_ENTRY") {
    const field = err.sqlMessage.match(/for key '(.+?)'/)[1].split(".").pop();
    return res.status(400).json({
      success: false,
      message: `The ${field} '${req.body[field]}' already exists. Please use a different one.`
    });
  }

  // Otros posibles errores de base de datos
  if (err.code === "ER_BAD_NULL_ERROR") {
    return res.status(400).json({
      success: false,
      message: `The field '${err.sqlMessage.match(/column '(.*?)'/)[1]}' cannot be empty.`
    });
  }

  if (err.code === "ER_DATA_TOO_LONG") {
    return res.status(400).json({
      success: false,
      message: `The field '${err.sqlMessage.match(/column '(.*?)'/)[1]}' exceeds the maximum allowed length.`
    });
  }

  // Errores generales (internos del servidor)
  return res.status(500).json({
    success: false,
    message: "An unexpected error occurred. Please try again later.",
    error: err.message || err
  });
};

module.exports = errorHandler;