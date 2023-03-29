class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    /* eslint-disable */
    console.log('APP ERROR', message);

    this.statusCode = statusCode || 500;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
