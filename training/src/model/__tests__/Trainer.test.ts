// SPDX-License-Identifier: MIT
import { BaseTrainer, LLMTrainer, ClassificationTrainer, TrainingResult, TrainingConfig } from '../index';

describe('BaseTrainer', () => {
  let config: { name: string; type: string; parameters: Record<string, unknown> };

  beforeEach(() => {
    config = { name: 'test-model', type: 'classification', parameters: {} };
  });

  describe('happy path', () => {
    test('should train with valid data', async () => {
      const trainer = new BaseTrainer(config, { epochs: 2, batchSize: 10 });
      const data = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }];
      const result = await trainer.train(data);
      expect(result.epochsCompleted).toBe(2);
      expect(result.finalLoss).toBeGreaterThan(0);
      expect(result.metrics).toHaveLength(2); // epoch_1_loss, epoch_2_loss
      expect(result.durationMs).toBeGreaterThan(0);
    });

    test('should save model', async () => {
      const trainer = new BaseTrainer(config);
      const result = await trainer.save();
      expect(result).toContain('checkpoints/test-model');
      expect(result).toContain('final.json');
    });

    test('should load model', async () => {
      const trainer = new BaseTrainer(config);
      await trainer.save();
      await trainer.load(result);
      // Just verify it doesn't throw
    });

    test('should split data correctly', () => {
      const trainer = new BaseTrainer(config);
      const data = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }, { id: 6 }];
      const { trainData, validationData } = trainer.splitData(data, 0.5);
      expect(trainData).toHaveLength(3);
      expect(validationData).toHaveLength(3);
    });

    test('should create batches correctly', () => {
      const trainer = new BaseTrainer(config);
      const data = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }];
      const batches = trainer.createBatches(data, 2);
      expect(batches).toHaveLength(3); // [1,2], [3,4], [5]
    });
  });

  describe('error cases', () => {
    test('should throw error when training already in progress', async () => {
      const trainer = new BaseTrainer(config, { epochs: 1 });
      await trainer.train([{ id: 1 }]);
      await expect(trainer.train([{ id: 2 }])).rejects.toThrow('Training already in progress');
    });

    test('should throw error for empty training data', async () => {
      const trainer = new BaseTrainer(config);
      await expect(trainer.train([])).rejects.toThrow('Training data cannot be empty');
      await expect(trainer.train(null as any)).rejects.toThrow('Training data cannot be empty');
      await expect(trainer.train(undefined as any)).rejects.toThrow('Training data cannot be empty');
    });

    test('should throw error for undefined data', async () => {
      const trainer = new BaseTrainer(config);
      await expect(trainer.train(undefined as any)).rejects.toThrow('Training data cannot be empty');
    });
  });
});

describe('LLMTrainer', () => {
  let config: { name: string; type: string; parameters: Record<string, unknown> };

  beforeEach(() => {
    config = { name: 'test-llm', type: 'llm', parameters: { contextLength: 2048 } };
  });

  describe('happy path', () => {
    test('should train LLM with valid data', async () => {
      const trainer = new LLMTrainer(config, { epochs: 2, batchSize: 4 });
      const data = [
        { text: 'Hello world' },
        { text: 'Good morning' },
        { text: 'How are you' }
      ];
      const result = await trainer.train(data);
      expect(result.epochsCompleted).toBe(2);
      expect(result.finalLoss).toBeGreaterThan(0);
      expect(result.durationMs).toBeGreaterThan(0);
    });

    test('should validate LLM data with text field', () => {
      const trainer = new LLMTrainer(config);
      const validData = [
        { text: 'Hello' },
        { content: 'World' }
      ];
      expect(trainer['validateLLMData'](validData)).toBe(true);
    });

    test('should reject LLM data without text fields', () => {
      const trainer = new LLMTrainer(config);
      const invalidData = [
        { id: 1 },
        { number: 42 }
      ];
      expect(trainer['validateLLMData'](invalidData)).toBe(false);
    });
  });

  describe('error cases', () => {
    test('should throw error for empty data', async () => {
      const trainer = new LLMTrainer(config);
      await expect(trainer.train([])).rejects.toThrow('Training data cannot be empty');
    });
  });
});

describe('ClassificationTrainer', () => {
  let config: { name: string; type: string; parameters: Record<string, unknown> };

  beforeEach(() => {
    config = { name: 'test-classifier', type: 'classification', parameters: {} };
  });

  describe('happy path', () => {
    test('should train classifier with valid data', async () => {
      const trainer = new ClassificationTrainer(config, { epochs: 2, batchSize: 10 });
      const data = [{ features: [1, 2, 3] }, { features: [4, 5, 6] }];
      const result = await trainer.train(data);
      expect(result.epochsCompleted).toBe(2);
      expect(result.finalLoss).toBeGreaterThan(0);
    });
  });
});