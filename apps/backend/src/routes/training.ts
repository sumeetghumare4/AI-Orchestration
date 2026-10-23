import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';
import { dataStore } from '../data/store';
import { NotFoundError } from '../middleware/errorHandler';

const router = Router();

router.use(authenticateToken);

// Get all training jobs
router.get('/', (_req: Request, res: Response) => {
  const jobs = dataStore.getAllTrainingJobs();
  res.json({
    success: true,
    data: jobs,
    count: jobs.length,
  });
});

// Get training job by ID
router.get('/:id', (req: Request, res: Response) => {
  const job = dataStore.getTrainingJob(req.params.id);

  if (!job) {
    throw new NotFoundError('Training job not found');
  }

  res.json({
    success: true,
    data: job,
  });
});

// Create new training job
router.post(
  '/',
  validate([
    body('modelId').isString().trim().isLength({ min: 1 }).withMessage('Model ID is required'),
    body('datasetId').isString().trim().isLength({ min: 1 }).withMessage('Dataset ID is required'),
    body('parameters').optional().isObject(),
  ]),
  (req: Request, res: Response) => {
    const { modelId, datasetId, parameters = {} } = req.body;

    // Verify model exists
    const model = dataStore.getModel(modelId);
    if (!model) {
      throw new NotFoundError('Model not found');
    }

    // Verify dataset exists
    const dataset = dataStore.getDataset(datasetId);
    if (!dataset) {
      throw new NotFoundError('Dataset not found');
    }

    const job = dataStore.createTrainingJob({
      modelId,
      datasetId,
      parameters,
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      data: job,
      message: 'Training job created successfully',
    });
  }
);

// Update training job status
router.patch(
  '/:id/status',
  validate([
    body('status').isIn(['pending', 'running', 'completed', 'failed', 'cancelled'])
      .withMessage('Invalid status'),
  ]),
  (req: Request, res: Response) => {
    const job = dataStore.updateTrainingJob(req.params.id, req.body);

    if (!job) {
      throw new NotFoundError('Training job not found');
    }

    res.json({
      success: true,
      data: job,
      message: 'Training job status updated',
    });
  }
);

// Cancel training job
router.post('/:id/cancel', (req: Request, res: Response) => {
  const job = dataStore.updateTrainingJob(req.params.id, {
    status: 'cancelled',
    completedAt: new Date(),
  });

  if (!job) {
    throw new NotFoundError('Training job not found');
  }

  res.json({
    success: true,
    data: job,
    message: 'Training job cancelled',
  });
});

// Delete training job
router.delete('/:id', (req: Request, res: Response) => {
  const deleted = dataStore.deleteTrainingJob(req.params.id);

  if (!deleted) {
    throw new NotFoundError('Training job not found');
  }

  res.json({
    success: true,
    message: 'Training job deleted successfully',
  });
});

export default router;
