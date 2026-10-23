import { validationResult, ValidationChain } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.type === 'field' ? (err as any).path : 'unknown',
        message: err.msg,
        value: err.value,
      })),
    });
  };
};

export const validateIdParam = () => {
  return [
    (req: Request, res: Response, next: NextFunction) => {
      const id = req.params.id;
      if (!id || id.length < 1) {
        res.status(400).json({ error: 'Valid ID parameter required' });
        return;
      }
      next();
    }
  ];
};
