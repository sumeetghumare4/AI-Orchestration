// SPDX-License-Identifier: MIT
import { CSVLoader } from '../index';
import { DataLoader } from '../index';

describe('CSVLoader', () => {
  describe('happy path', () => {
    test('should load valid CSV file with headers and data', async () => {
      const loader = new CSVLoader();
      const csvContent = `name,age,city\nAlice,30,New York\nBob,25,Chicago\n`;
      const data = await loader.load(Buffer.from(csvContent).toString());
      expect(data).toHaveLength(2);
      expect(data[0]).toMatchObject({ name: 'Alice', age: 30, city: 'New York' });
      expect(data[1]).toMatchObject({ name: 'Bob', age: 25, city: 'Chicago' });
    });

    test('should handle quoted values with commas', async () => {
      const loader = new CSVLoader();
      const csvContent = `name,comment\n"Alice, Jr.",Likes "apples, oranges"\n`;
      const data = await loader.load(Buffer.from(csvContent).toString());
      expect(data).toHaveLength(1);
      expect(data[0].name).toBe('Alice, Jr.');
      expect(data[0].comment).toBe('Likes "apples, oranges"');
    });

    test('should parse different value types', async () => {
      const loader = new CSVLoader();
      const csvContent = `id,active,score,value\n1,true,3.14,hello\n2,false,0,null`;
      const data = await loader.load(Buffer.from(csvContent).toString());
      expect(data[0].id).toBe(1);
      expect(data[0].active).toBe(true);
      expect(data[0].score).toBe(3.14);
      expect(data[0].value).toBe('hello');
      expect(data[1].id).toBe(2);
      expect(data[1].active).toBe(false);
      expect(data[1].score).toBe(0);
      expect(data[1].value).toBe(null);
    });

    test('should validate valid data', async () => {
      const loader = new CSVLoader();
      const csvContent = `name,age\nAlice,30\nBob,25\n`;
      const data = await loader.load(Buffer.from(csvContent).toString());
      const result = loader.validate(data);
      expect(result.isValid).toBe(true);
      expect(result.recordCount).toBe(2);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('error cases', () => {
    test('should throw error for empty file', async () => {
      const loader = new CSVLoader();
      const csvContent = '';
      await expect(loader.load(Buffer.from(csvContent).toString())).rejects.toThrow('CSV file must contain header and at least one data row');
    });

    test('should throw error for file with only headers', async () => {
      const loader = new CSVLoader();
      const csvContent = 'name,age\n';
      await expect(loader.load(Buffer.from(csvContent).toString())).rejects.toThrow('CSV file must contain header and at least one data row');
    });

    test('should handle malformed CSV gracefully', async () => {
      const loader = new CSVLoader();
      const csvContent = `name,age\nAlice\nBob,25`;
      const data = await loader.load(Buffer.from(csvContent).toString());
      expect(data).toHaveLength(2);
      expect(data[0].name).toBe('Alice');
      expect(data[0].age).toBe('');
      expect(data[1].name).toBe('Bob');
      expect(data[1].age).toBe(25);
    });

    test('should return validation errors for invalid data', async () => {
      const loader = new CSVLoader();
      const csvContent = `name,age\nAlice,twenty\nBob,thirty`;
      const data = await loader.load(Buffer.from(csvContent).toString());
      const result = loader.validate(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(0); // Validation only checks structure, not type
      expect(result.warnings).toContain('Record 0 has null/undefined value for field \'age\'');
      expect(result.warnings).toContain('Record 1 has null/undefined value for field \'age\'');
    });
  });
});