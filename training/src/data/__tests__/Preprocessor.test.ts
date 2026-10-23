// SPDX-License-Identifier: MIT
import * as fs from 'fs/promises';
import { createPreprocessor, defaultPreprocessors, PreprocessorConfig } from '../index';

describe('Preprocessor', () => {
  describe('happy path', () => {
    test('should process data with pipeline steps', () => {
      const preprocessor = createPreprocessor([
        defaultPreprocessors.trimStrings,
        defaultPreprocessors.normalizeKeys
      ]);

      const data = [
        { Name: '  Alice  ', Age: 30 },
        { Name: '  Bob  ', Age: 25 }
      ];

      const result = preprocessor(data);
      expect(result.validation.isValid).toBe(true);
      expect(result.data[0].name).toBe('alice');
      expect(result.data[0].age).toBe(30);
    });

    test('should handle maxRecords config', () => {
      const preprocessor = createPreprocessor([], { maxRecords: 2 });
      const data = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];

      const result = preprocessor(data);
      expect(result.data).toHaveLength(2);
      expect(result.validation.warnings).toContain('Data truncated from 4 to 2 records');
    });

    test('should validate required fields', () => {
      const preprocessor = createPreprocessor([], { requiredFields: ['name', 'age'] });
      const data = [
        { name: 'Alice', age: 30 },
        { name: 'Bob' },
        { age: 25 }
      ];

      const result = preprocessor(data);
      expect(result.validation.isValid).toBe(false);
      expect(result.validation.errors).toContain('Record 1 missing required field: age');
      expect(result.validation.errors).toContain('Record 2 missing required field: name');
    });

    test('should deduplicate records', () => {
      const preprocessor = createPreprocessor([defaultPreprocessors.deduplicate]);
      const data = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 1, name: 'Alice' },
        { id: 3, name: 'Charlie' }
      ];

      const result = preprocessor(data);
      expect(result.data).toHaveLength(3);
    });

    test('should remove null values', () => {
      const preprocessor = createPreprocessor([defaultPreprocessors.removeNulls]);
      const data = [
        { id: 1, name: 'Alice' },
        { id: 2, name: null },
        { id: 3, name: 'Charlie' }
      ];

      const result = preprocessor(data);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].name).toBe('Alice');
      expect(result.data[1].name).toBe('Charlie');
    });
  });

  describe('error cases', () => {
    test('should handle non-array input', () => {
      const preprocessor = createPreprocessor();
      const result = preprocessor(null as any);
      expect(result.validation.isValid).toBe(false);
      expect(result.validation.errors).toContain('Input data must be an array');
    });

    test('should handle preprocessing step errors', () => {
      const errorStep = () => { throw new Error('Step failed'); };
      const preprocessor = createPreprocessor([errorStep]);
      const data = [{ id: 1 }];

      const result = preprocessor(data);
      expect(result.validation.isValid).toBe(false);
      expect(result.validation.errors).toContain('Preprocessing step failed: Step failed');
    });

    test('should handle undefined values in required fields', () => {
      const preprocessor = createPreprocessor([], { requiredFields: ['name'] });
      const data = [{ name: undefined }];

      const result = preprocessor(data);
      expect(result.validation.isValid).toBe(false);
      expect(result.validation.errors).toContain('Record 0 missing required field: name');
    });

    test('should handle empty pipeline', () => {
      const preprocessor = createPreprocessor([], {});
      const data = [{ id: 1 }, { id: 2 }];

      const result = preprocessor(data);
      expect(result.validation.isValid).toBe(true);
      expect(result.data).toHaveLength(2);
    });
  });
});