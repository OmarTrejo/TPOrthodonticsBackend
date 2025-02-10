const winston = require('winston');
require('winston-daily-rotate-file');

const transport = new winston.transports.DailyRotateFile({
    filename: 'logs/%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '10d'
});

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} [${level}] ${message}`;   // Formato del log
        })
    ),
    transports: [
        transport,
        new winston.transports.Console({    // Log en consola
            format: winston.format.simple()
        })
    ]
});

module.exports = logger;
