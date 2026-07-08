export class AppError extends Error {
  constructor(message, status = 500, details = null) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.details = details;
  }

  static badRequest(message, details = null) {
    return new AppError(message, 400, details);
  }

  static unauthorized(message = "Unauthorized") {
    return new AppError(message, 401);
  }

  static notFound(message = "Not found") {
    return new AppError(message, 404);
  }

  static tooManyRequests(message = "Too many requests") {
    return new AppError(message, 429);
  }

  static unprocessable(message, details = null) {
    return new AppError(message, 422, details);
  }

  static timeout(message = "Request timed out") {
    return new AppError(message, 504);
  }
}
