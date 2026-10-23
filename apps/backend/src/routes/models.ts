import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';
import { dataStore } from '../data/store';
import { NotFoundError, ValidationError } from '../middleware/errorHandler';

const router = Router();

router.use(authenticateToken);

// Get all models
router.get('/', (_req: Request, res: Response) => {
  const models = dataStore.getAllModels();
  res.json({
    success: true,
    data: models,
    count: models.length,
  });
});

// Get model by ID
router.get('/:id', (req: Request, res: Response) => {
  const model = dataStore.getModel(req.params.id);

  if (!model) {
    throw new NotFoundError('Model not found');
  }

  res.json({
    success: true,
    data: model,
  });
});

// Create new model
router.post(
  '/',
  validate([
    body('name').isString().trim().isLength({ min: 1 }).withMessage('Name is required'),
    body('type').isIn(['llm', 'embedding', 'classification']).withMessage('Invalid model type'),
    body('parameters').isObject().withMessage('Parameters must be an object'),
  ]),
  (req: Request, res: Response) => {
    const { name, type, parameters } = req.body;

    const model = dataStore.createModel({ name, type, parameters });

    res.status(201).json({
      success: true,
      data: model,
      message: 'Model created successfully',
    });
  }
);

// Update model
router.put(
  '/:id',
  validate([
    body('name').optional().isString().trim().isLength({ min: 1 }),
    body('type').optional().isIn(['llm', 'embedding', 'classification']),
    body('parameters').optional().isObject(),
  ]),
  (req: Request, res: Response) => {
    const model = dataStore.updateModel(req.params.id, req.body);

    if (!model) {
      throw new NotFoundError('Model not found');
    }

    res.json({
      success: true,
      data: model,
      message: 'Model updated successfully',
    });
  }
);

// Delete model
router.delete('/:id', (req: Request, res: Response) => {
  const deleted = dataStore.deleteModel(req.params.id);

  if (!deleted) {
    throw new NotFoundError('Model not found');
  }

  res.json({
    success: true,
    message: 'Model deleted successfully',
  });
});

export default router;
