import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';

  console.error(`[${new Date().toISOString()}] Error:`, {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    code,
  });

  const response: any = {
    error: {
      code,
      message: err.message || 'Internal server error',
    },
    timestamp: new Date().toISOString(),
    path: req.path,
  };

  if (process.env.NODE_ENV === 'development') {
    response.error.stack = err.stack;
  }

  if (statusCode === 404) {
    response.error.message = 'Resource not found';
  }

  res.status(statusCode).json(response);
};

export const notFoundHandler = (req: Request, res: Response): void => {
  const error = new Error(`Route ${req.method} ${req.path} not found`) as AppError;
  error.statusCode = 404;
  error.code = 'NOT_FOUND';

  const statusCode = error.statusCode || 500;
  res.status(statusCode).json({
    error: {
      code: error.code,
      message: error.message,
    },
    timestamp: new Date().toISOString(),
    path: req.path,
  });
};

export class ValidationError extends Error implements AppError {
  statusCode = 400;
  code = 'VALIDATION_ERROR';

  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error implements AppError {
  statusCode = 404;
  code = 'NOT_FOUND';

  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends Error implements AppError {
  statusCode = 401;
  code = 'UNAUTHORIZED';

  constructor(message: string = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error implements AppError {
  statusCode = 403;
  code = 'FORBIDDEN';

  constructor(message: string = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}
