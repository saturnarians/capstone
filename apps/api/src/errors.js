class ApiError extends Error {
  constructor(status, code, message, fields) {
    super(message);
    Object.assign(this, { status, code, fields });
  }
}

const notFound = (resource = 'Resource') => new ApiError(404,
  `${resource.replaceAll('-', '').toUpperCase()}_NOT_FOUND`, `${resource} not found.`);
const unauthorized = () => new ApiError(401, 'UNAUTHENTICATED', 'A valid session is required.');
const forbidden = () => new ApiError(403, 'ADMIN_REQUIRED', 'Administrator access is required.');

function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  let err = error;
  if (error.type === 'entity.parse.failed') {
    err = new ApiError(400, 'INVALID_JSON', 'Request body must be valid JSON.');
  } else if (error.type === 'entity.too.large') {
    err = new ApiError(413, 'PAYLOAD_TOO_LARGE', 'Request body is too large.');
  } else if (error.type === 'charset.unsupported' || error.type === 'encoding.unsupported') {
    err = new ApiError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Use UTF-8 JSON.');
  } else if (error.code === 11000) {
    err = new ApiError(409, 'EMAIL_ALREADY_EXISTS', 'An account with this email already exists.');
  } else if (error.name === 'ValidationError') {
    err = new ApiError(422, 'VALIDATION_ERROR', 'The request contains invalid data.',
      Object.fromEntries(Object.keys(error.errors).map(key => [key, 'Invalid value.'])));
  }
  if (!(err instanceof ApiError)) {
    // Do not log connection strings, request bodies, tokens, or raw database errors.
    req.app.locals.logger?.error({ event: 'request_failed', name: error.name });
    err = new ApiError(500, 'INTERNAL_ERROR', 'Something went wrong. Please try again.');
  }
  const body = { code: err.code, message: err.message };
  if (err.fields) body.fields = err.fields;
  res.status(err.status).json({ error: body });
}

module.exports = { ApiError, notFound, unauthorized, forbidden, errorHandler };
