const { validationResult } = require("express-validator");

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
        status: false,
        message: "Validation failed",
        data: errors.array().map(err => ({
            field: err.path, // Cambia "path" a "field"
            message: err.msg // Usa solo el mensaje
        }))
    });
  }
  next();
};

module.exports = validateRequest;