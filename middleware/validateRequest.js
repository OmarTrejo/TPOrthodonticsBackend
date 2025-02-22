const { validationResult } = require("express-validator");

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map(err => err.msg); // Extrae solo los mensajes de error
    const errorResponse = {
      message: "Validation failed",
      details: errorDetails, // Array de mensajes de error
      // status: 400, // Código de estado HTTP
      traceId: req.traceId || "", // Opcional: puedes agregar un traceId si lo tienes
      url: req.originalUrl, // URL de la solicitud
    };

    return res.status(400).json(errorResponse);
  }

  next();
};

module.exports = validateRequest;