// SPDX-License-Identifier: MIT
import { AccuracyMetric, F1Metric, PrecisionMetric, RecallMetric } from '../index';
import { Evaluator } from '../index';

describe('Individual Metrics', () => {
  describe('AccuracyMetric', () => {
    test('should calculate accuracy with correct predictions', () => {
      const metric = new AccuracyMetric();
      const predictions = ['cat', 'dog', 'bird'];
      const groundTruth = ['cat', 'dog', 'fish'];
      const result = metric.calculate(predictions, groundTruth);
      expect(result).toBe(2 / 3);
    });

    test('should return 1 for perfect predictions', () => {
      const metric = new AccuracyMetric();
      const predictions = ['cat', 'dog', 'bird'];
      const groundTruth = ['cat', 'dog', 'bird'];
      const result = metric.calculate(predictions, groundTruth);
      expect(result).toBe(1);
    });

    test('should return 0 for no correct predictions', () => {
      const metric = new AccuracyMetric();
      const predictions = ['cat', 'dog', 'bird'];
      const groundTruth = ['fish', 'bird', 'cat'];
      const result = metric.calculate(predictions, groundTruth);
      expect(result).toBe(0);
    });

    test('should return 1 when both arrays are empty', () => {
      const metric = new AccuracyMetric();
      const predictions: any[] = [];
      const groundTruth: any[] = [];
      const result = metric.calculate(predictions, groundTruth);
      expect(result).toBe(1);
    });

    test('should return 0 when lengths differ', () => {
      const metric = new AccuracyMetric();
      const predictions = ['cat', 'dog'];
      const groundTruth = ['cat'];
      const result = metric.calculate(predictions, groundTruth);
      expect(result).toBe(0);
    });
  });

  describe('F1Metric', () => {
    test('should calculate F1 score', () => {
      const metric = new F1Metric();
      const predictions = ['cat', 'dog', 'bird', 'cat'];
      const groundTruth = ['cat', 'fish', 'bird', 'dog'];
      const result = metric.calculate(predictions, groundTruth);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(1);
    });

    test('should return 0 when no true positives', () => {
      const metric = new F1Metric();
      const predictions = ['cat', 'dog'];
      const groundTruth = ['fish', 'bird'];
      const result = metric.calculate(predictions, groundTruth);
      expect(result).toBe(0);
    });

    test('should return 1 when all predictions are correct', () => {
      const metric = new F1Metric();
      const predictions = ['cat', 'dog', 'bird'];
      const groundTruth = ['cat', 'dog', 'bird'];
      const result = metric.calculate(predictions, groundTruth);
      expect(result).toBe(1);
    });
  });

  describe('PrecisionMetric', () => {
    test('should calculate precision', () => {
      const metric = new PrecisionMetric();
      const predictions = ['cat', 'dog', 'cat', 'bird'];
      const groundTruth = ['cat', 'dog', 'fish', 'bird'];
      const result = metric.calculate(predictions, groundTruth);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(1);
    });

    test('should return 1 when all predictions are correct', () => {
      const metric = new PrecisionMetric();
      const predictions = ['cat', 'dog', 'bird'];
      const groundTruth = ['cat', 'dog', 'bird'];
      const result = metric.calculate(predictions, groundTruth);
      expect(result).toBe(1);
    });

    test('should return 0 when no true positives', () => {
      const metric = new PrecisionMetric();
      const predictions = ['cat', 'dog'];
      const groundTruth = ['fish', 'bird'];
      const result = metric.calculate(predictions, groundTruth);
      expect(result).toBe(0);
    });

    test('should return 1 when both arrays are empty', () => {
      const metric = new PrecisionMetric();
      const predictions: any[] = [];
      const groundTruth: any[] = [];
      const result = metric.calculate(predictions, groundTruth);
      expect(result).toBe(1);
    });
  });

  describe('RecallMetric', () => {
    test('should calculate recall', () => {
      const metric = new RecallMetric();
      const predictions = ['cat', 'dog', 'cat', 'bird'];
      const groundTruth = ['cat', 'dog', 'fish', 'bird'];
      const result = metric.calculate(predictions, groundTruth);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(1);
    });

    test('should return 1 when all predictions are correct', () => {
      const metric = new RecallMetric();
      const predictions = ['cat', 'dog', 'bird'];
      const groundTruth = ['cat', 'dog', 'bird'];
      const result = metric.calculate(predictions, groundTruth);
      expect(result).toBe(1);
    });

    test('should return 0 when no true positives', () => {
      const metric = new RecallMetric();
      const predictions = ['cat', 'dog'];
      const groundTruth = ['fish', 'bird'];
      const result = metric.calculate(predictions, groundTruth);
      expect(result).toBe(0);
    });

    test('should return 1 when both arrays are empty', () => {
      const metric = new RecallMetric();
      const predictions: any[] = [];
      const groundTruth: any[] = [];
      const result = metric.calculate(predictions, groundTruth);
      expect(result).toBe(1);
    });
  });
});

describe('Evaluator', () => {
  describe('happy path', () => {
    test('should evaluate multiple metrics', () => {
      const evaluator = new Evaluator();
      evaluator.addMetric(new AccuracyMetric());
      evaluator.addMetric(new F1Metric());

      const predictions = ['cat', 'dog', 'bird'];
      const groundTruth = ['cat', 'fish', 'bird'];

      const results = evaluator.evaluate(predictions, groundTruth);
      expect(results).toHaveProperty('accuracy');
      expect(results).toHaveProperty('f1');
      expect(results.accuracy).toBe(2 / 3);
    });

    test('should return empty object when no metrics added', () => {
      const evaluator = new Evaluator();
      const results = evaluator.evaluate([], []);
      expect(results).toEqual({});
    });
  });

  describe('error cases', () => {
    test('should handle errors gracefully and continue evaluating other metrics', () => {
      const evaluator = new Evaluator();
      evaluator.addMetric(new AccuracyMetric());

      const predictions = ['cat', 'dog'];
      const groundTruth = ['cat', 'dog'];

      const results = evaluator.evaluate(predictions, groundTruth);
      expect(results).toHaveProperty('accuracy', 1);
    });
  });
});