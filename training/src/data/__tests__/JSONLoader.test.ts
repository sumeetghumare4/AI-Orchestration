// SPDX-License-Identifier: MIT
import { JSONLoader } from '../index';
import { DataLoader } from '../index';

describe('JSONLoader', () => {
  describe('happy path', () => {
    test('should load valid JSON array of objects', async () => {
      const loader = new JSONLoader();
      const jsonContent = JSON.stringify([
        { name: 'Alice', age: 30, city: 'New York' },
        { name: 'Bob', age: 25, city: 'Chicago' }
      ]);
      const data = await loader.load(Buffer.from(jsonContent).toString());
      expect(data).toHaveLength(2);
      expect(data[0]).toMatchObject({ name: 'Alice', age: 30, city: 'New York' });
      expect(data[1]).toMatchObject({ name: 'Bob', age: 25, city: 'Chicago' });
    });

    test('should validate valid data', async () => {
      const loader = new JSONLoader();
      const data = await loader.load('[]');
      const result = loader.validate(data);
      expect(result.isValid).toBe(true);
      expect(result.recordCount).toBe(0);
    });

    test('should handle array with empty objects', async () => {
      const loader = new JSONLoader();
      const jsonContent = JSON.stringify([{}, { name: 'Alice' }]);
      const data = await loader.load(Buffer.from(jsonContent).toString());
      expect(data).toHaveLength(2);
      expect(data[0]).toEqual({});
      expect(data[1]).toMatchObject({ name: 'Alice' });
    });

    test('should throw error for non-array JSON', async () => {
      const loader = new JSONLoader();
      await expect(loader.load(Buffer.from('{"name": "Alice"}').toString())).rejects.toThrow('JSON file must contain an array of records');
    });

    test('should throw error for invalid JSON', async () => {
      const loader = new JSONLoader();
      await expect(loader.load(Buffer.from('{invalid json}').toString())).rejects.toThrow('Invalid JSON format');
    });

    test('should throw error for JSON array with non-object items', async () => {
      const loader = new JSONLoader();
      await expect(loader.load(Buffer.from('[1, 2, "three"]').toString())).rejects.toThrow('Each JSON item must be an object');
    });
  });

  describe('error cases', () => {
    test('should return validation errors for empty array', async () => {
      const loader = new JSONLoader();
      const data = await loader.load('[]');
      const result = loader.validate(data);
      expect(result.isValid).toBe(true); // Empty array is valid structurally
      expect(result.warnings).toContain('Data array is empty');
    });

    test('should return validation errors for non-object records', async () => {
      const loader = new JSONLoader();
      const data = await loader.load('[null, undefined, 42]');
      const result = loader.validate(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Record 0 is not a valid object');
      expect(result.errors).toContain('Record 1 is not a valid object');
      expect(result.errors).toContain('Record 2 is not a valid object');
    });

    test('should return warnings for empty objects', async () => {
      const loader = new JSONLoader();
      const data = await loader.load('[{}, {}]');
      const result = loader.validate(data);
      expect(result.warnings).toContain('Record 0 is empty');
      expect(result.warnings).toContain('Record 1 is empty');
    });
  });
});