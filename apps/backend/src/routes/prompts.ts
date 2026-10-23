import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';
import { dataStore } from '../data/store';
import { NotFoundError } from '../middleware/errorHandler';

const router = Router();

router.use(authenticateToken);

// Get all prompts
router.get('/', (_req: Request, res: Response) => {
  const prompts = dataStore.getAllPrompts();
  res.json({
    success: true,
    data: prompts,
    count: prompts.length,
  });
});

// Get prompt by ID
router.get('/:id', (req: Request, res: Response) => {
  const prompt = dataStore.getPrompt(req.params.id);

  if (!prompt) {
    throw new NotFoundError('Prompt not found');
  }

  res.json({
    success: true,
    data: prompt,
  });
});

// Create new prompt
router.post(
  '/',
  validate([
    body('name').isString().trim().isLength({ min: 1 }).withMessage('Name is required'),
    body('version').isString().trim().isLength({ min: 1 }).withMessage('Version is required'),
    body('template').isString().trim().isLength({ min: 1 }).withMessage('Template is required'),
    body('variables').isArray().withMessage('Variables must be an array'),
    body('isActive').optional().isBoolean(),
  ]),
  (req: Request, res: Response) => {
    const { name, version, template, variables, isActive = true } = req.body;

    const prompt = dataStore.createPrompt({ name, version, template, variables, isActive });

    res.status(201).json({
      success: true,
      data: prompt,
      message: 'Prompt created successfully',
    });
  }
);

// Update prompt
router.put(
  '/:id',
  validate([
    body('name').optional().isString().trim().isLength({ min: 1 }),
    body('version').optional().isString().trim().isLength({ min: 1 }),
    body('template').optional().isString().trim().isLength({ min: 1 }),
    body('variables').optional().isArray(),
    body('isActive').optional().isBoolean(),
  ]),
  (req: Request, res: Response) => {
    const prompt = dataStore.updatePrompt(req.params.id, req.body);

    if (!prompt) {
      throw new NotFoundError('Prompt not found');
    }

    res.json({
      success: true,
      data: prompt,
      message: 'Prompt updated successfully',
    });
  }
);

// Delete prompt
router.delete('/:id', (req: Request, res: Response) => {
  const deleted = dataStore.deletePrompt(req.params.id);

  if (!deleted) {
    throw new NotFoundError('Prompt not found');
  }

  res.json({
    success: true,
    message: 'Prompt deleted successfully',
  });
});

export default router;
