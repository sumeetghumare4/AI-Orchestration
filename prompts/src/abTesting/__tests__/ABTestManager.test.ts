// SPDX-License-Identifier: MIT
import { ABTestManager, ABTestVariant, ABTest } from '../index';

describe('ABTestManager', () => {
  let manager: ABTestManager;

  beforeEach(() => {
    manager = new ABTestManager();
  });

  describe('happy path', () => {
    test('should create a new A/B test', () => {
      const variants: ABTestVariant[] = [
        { id: 'variant-a', promptId: 'prompt-1', weight: 0.5 },
        { id: 'variant-b', promptId: 'prompt-2', weight: 0.5 }
      ];
      const test = manager.createTest('test-1', 'Test A/B', variants);
      expect(test.id).toBe('test-1');
      expect(test.name).toBe('Test A/B');
      expect(test.variants).toHaveLength(2);
      expect(test.startDate).toBeInstanceOf(Date);
    });

    test('should select variant based on weight', () => {
      const variants: ABTestVariant[] = [
        { id: 'variant-a', promptId: 'prompt-1', weight: 1.0 },
        { id: 'variant-b', promptId: 'prompt-2', weight: 0.0 }
      ];
      manager.createTest('test-1', 'Test', variants);
      const variant = manager.selectVariant('test-1');
      expect(variant?.id).toBe('variant-a');
    });

    test('should select variant proportionally', () => {
      const variants: ABTestVariant[] = [
        { id: 'variant-a', promptId: 'prompt-1', weight: 0.8 },
        { id: 'variant-b', promptId: 'prompt-2', weight: 0.2 }
      ];
      manager.createTest('test-1', 'Test', variants);

      // Run multiple times to check distribution
      const results: Record<string, number> = { 'variant-a': 0, 'variant-b': 0 };
      for (let i = 0; i < 1000; i++) {
        const variant = manager.selectVariant('test-1');
        if (variant) results[variant.id]++;
      }

      expect(results['variant-a']).toBeGreaterThan(700);
      expect(results['variant-b']).toBeGreaterThan(100);
      expect(results['variant-b']).toBeLessThan(300);
    });

    test('should return first variant as fallback', () => {
      const variants: ABTestVariant[] = [
        { id: 'variant-a', promptId: 'prompt-1', weight: 0.5 },
        { id: 'variant-b', promptId: 'prompt-2', weight: 0.5 }
      ];
      manager.createTest('test-1', 'Test', variants);
      const variant = manager.selectVariant('test-1');
      expect(variant).not.toBeNull();
      expect(variants.map(v => v.id)).toContain(variant!.id);
    });

    test('should record results without throwing', () => {
      const variants: ABTestVariant[] = [
        { id: 'variant-a', promptId: 'prompt-1', weight: 1.0 }
      ];
      manager.createTest('test-1', 'Test', variants);
      expect(() => manager.recordResult('test-1', 'variant-a', 'click', 1)).not.toThrow();
    });
  });

  describe('error cases', () => {
    test('should return null for non-existent test', () => {
      const variant = manager.selectVariant('non-existent');
      expect(variant).toBeNull();
    });

    test('should handle empty variants array', () => {
      manager.createTest('test-1', 'Test', []);
      const variant = manager.selectVariant('test-1');
      expect(variant).toBeNull();
    });

    test('should handle all zero weights', () => {
      const variants: ABTestVariant[] = [
        { id: 'variant-a', promptId: 'prompt-1', weight: 0 },
        { id: 'variant-b', promptId: 'prompt-2', weight: 0 }
      ];
      manager.createTest('test-1', 'Test', variants);
      const variant = manager.selectVariant('test-1');
      expect(variant?.id).toBe('variant-a'); // Falls back to first variant
    });
  });
});