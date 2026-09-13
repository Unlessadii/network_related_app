const { errorResponse } = require('../utils/helpers');

function errorHandler(err, req, res, next) {
  console.error('[ServerError]', err);

  if (err.type === 'entity.parse.failed') {
    return errorResponse(res, 'Malformed JSON payload', 400);
  }

  const statusCode = err.status || err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'An internal server error occurred' 
    : (err.message || 'Internal Server Error');

  return errorResponse(res, message, statusCode);
}

module.exports = errorHandler;
