const createError = (message, details=[], traceId="", url="") => {
    const error = new Error(message);
    // error.status = status;
    error.details = details;
    error.traceId = traceId;
    error.url = url;
    return error;
}

module.exports = createError;