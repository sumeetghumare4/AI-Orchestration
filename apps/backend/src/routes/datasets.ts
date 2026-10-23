import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';
import { dataStore } from '../data/store';
import { NotFoundError } from '../middleware/errorHandler';

const router = Router();

router.use(authenticateToken);

// Get all datasets
router.get('/', (_req: Request, res: Response) => {
  const datasets = dataStore.getAllDatasets();
  res.json({
    success: true,
    data: datasets,
    count: datasets.length,
  });
});

// Get dataset by ID
router.get('/:id', (req: Request, res: Response) => {
  const dataset = dataStore.getDataset(req.params.id);

  if (!dataset) {
    throw new NotFoundError('Dataset not found');
  }

  res.json({
    success: true,
    data: dataset,
  });
});

// Create new dataset
router.post(
  '/',
  validate([
    body('name').isString().trim().isLength({ min: 1 }).withMessage('Name is required'),
    body('type').isIn(['text', 'image', 'tabular']).withMessage('Invalid dataset type'),
    body('size').isInt({ min: 0 }).withMessage('Size must be a non-negative integer'),
    body('description').optional().isString(),
  ]),
  (req: Request, res: Response) => {
    const { name, type, description, size } = req.body;

    const dataset = dataStore.createDataset({ name, type, description, size });

    res.status(201).json({
      success: true,
      data: dataset,
      message: 'Dataset created successfully',
    });
  }
);

// Update dataset
router.put(
  '/:id',
  validate([
    body('name').optional().isString().trim().isLength({ min: 1 }),
    body('type').optional().isIn(['text', 'image', 'tabular']),
    body('description').optional().isString(),
    body('size').optional().isInt({ min: 0 }),
  ]),
  (req: Request, res: Response) => {
    const dataset = dataStore.updateDataset(req.params.id, req.body);

    if (!dataset) {
      throw new NotFoundError('Dataset not found');
    }

    res.json({
      success: true,
      data: dataset,
      message: 'Dataset updated successfully',
    });
  }
);

// Delete dataset
router.delete('/:id', (req: Request, res: Response) => {
  const deleted = dataStore.deleteDataset(req.params.id);

  if (!deleted) {
    throw new NotFoundError('Dataset not found');
  }

  res.json({
    success: true,
    message: 'Dataset deleted successfully',
  });
});

export default router;
