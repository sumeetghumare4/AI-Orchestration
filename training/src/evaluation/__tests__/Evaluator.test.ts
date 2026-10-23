// SPDX-License-Identifier: MIT
import { Evaluator, AccuracyMetric, F1Metric } from '../index';

describe('Evaluator Advanced Tests', () => {
  describe('happy path', () => {
    test('should calculate per-class metrics', () => {
      const evaluator = new Evaluator();
      evaluator.addMetric(new AccuracyMetric());

      const predictions = ['cat', 'dog', 'cat', 'bird'];
      const groundTruth = ['cat', 'cat', 'cat', 'bird'];

      const report = evaluator.getDetailedReport(predictions, groundTruth);
      expect(report.totalSamples).toBe(4);
      expect(report.metrics).toHaveProperty('accuracy');
      expect(report.perClassMetrics).toBeDefined();
    });

    test('should add metric summaries', () => {
      const evaluator = new Evaluator();
      evaluator.addMetric(new AccuracyMetric());
      evaluator.addMetricSummary('accuracy', 'Overall accuracy metric');

      const summary = evaluator.getSummary();
      expect(summary).toContain('Accuracy metric');
    });

    test('should remove metrics', () => {
      const evaluator = new Evaluator();
      evaluator.addMetric(new AccuracyMetric());
      evaluator.addMetric(new F1Metric());

      expect(evaluator.getMetrics().size).toBe(2);
      evaluator.removeMetric('f1');
      expect(evaluator.getMetrics().size).toBe(1);
    });

    test('should clear all metrics', () => {
      const evaluator = new Evaluator();
      evaluator.addMetric(new AccuracyMetric());
      evaluator.addMetric(new F1Metric());

      evaluator.clearMetrics();
      expect(evaluator.getMetrics().size).toBe(0);
    });

    test('should evaluate with specific metrics', () => {
      const evaluator = new Evaluator();
      const predictions = ['cat', 'dog', 'bird'];
      const groundTruth = ['cat', 'dog', 'bird'];

      const results = evaluator.evaluateWithMetrics(predictions, groundTruth, [new AccuracyMetric()]);
      expect(results).toHaveProperty('accuracy');
      expect(results.accuracy).toBe(1);
    });
  });

  describe('error cases', () => {
    test('should handle empty predictions', () => {
      const evaluator = new Evaluator();
      evaluator.addMetric(new AccuracyMetric());

      const results = evaluator.evaluate([], []);
      expect(results.accuracy).toBe(1);
    });

    test('should handle mismatched lengths', () => {
      const evaluator = new Evaluator();
      evaluator.addMetric(new AccuracyMetric());

      const results = evaluator.evaluate(['cat', 'dog'], ['cat']);
      expect(results.accuracy).toBe(0);
    });

    test('should skip metrics when none added', () => {
      const evaluator = new Evaluator();
      const predictions = ['cat', 'dog'];
      const groundTruth = ['cat', 'dog'];

      const results = evaluator.evaluate(predictions, groundTruth);
      expect(results).toEqual({});
    });
  });
});