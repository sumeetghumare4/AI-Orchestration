import * as fs from 'fs/promises';
import * as path from 'path';

export interface DataLoader<T = Record<string, any>> {
  name: string;
  load(path: string): Promise<T[]>;
  validate(data: T[]): ValidationResult;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  recordCount: number;
}

export interface PreprocessorConfig {
  validateSchema?: boolean;
  requiredFields?: string[];
  maxRecords?: number;
}

export class CSVLoader implements DataLoader {
  name = 'csv';

  async load(filePath: string): Promise<Record<string, any>[]> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split(/\r?\n/).filter(line => line.trim());

      if (lines.length < 2) {
        throw new Error('CSV file must contain header and at least one data row');
      }

      const headers = this.parseCSVLine(lines[0]);
      const data: Record<string, any>[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = this.parseCSVLine(lines[i]);
        if (values.length === 0) continue;

        const record: Record<string, any> = {};
        headers.forEach((header, index) => {
          const value = values[index] || '';
          record[header] = this.parseValue(value);
        });
        data.push(record);
      }

      return data;
    } catch (error) {
      throw new Error(`Failed to load CSV file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  private parseValue(value: string): any {
    if (value === '') return null;
    if (value === 'null') return null;
    if (value === 'true') return true;
    if (value === 'false') return false;

    const num = Number(value);
    if (!isNaN(num)) {
      return num;
    }

    return value;
  }

  validate(data: Record<string, any>[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!Array.isArray(data)) {
      errors.push('Data must be an array');
      return { isValid: false, errors, warnings, recordCount: 0 };
    }

    if (data.length === 0) {
      warnings.push('Data array is empty');
    }

    if (data.length > 0) {
      const keys = Object.keys(data[0]);
      data.forEach((record, index) => {
        const recordKeys = Object.keys(record);
        if (recordKeys.length !== keys.length) {
          warnings.push(`Record ${index} has different number of fields`);
        }
        recordKeys.forEach(key => {
          if (record[key] === undefined || record[key] === null) {
            warnings.push(`Record ${index} has null/undefined value for field '${key}'`);
          }
        });
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      recordCount: data.length
    };
  }
}

export class JSONLoader implements DataLoader {
  name = 'json';

  async load(filePath: string): Promise<Record<string, any>[]> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const parsed = JSON.parse(content);

      if (!Array.isArray(parsed)) {
        throw new Error('JSON file must contain an array of records');
      }

      return parsed.map(item => {
        if (typeof item !== 'object' || item === null) {
          throw new Error('Each JSON item must be an object');
        }
        return item as Record<string, any>;
      });
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON format: ${error.message}`);
      }
      throw new Error(`Failed to load JSON file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  validate(data: Record<string, any>[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!Array.isArray(data)) {
      errors.push('Data must be an array');
      return { isValid: false, errors, warnings, recordCount: 0 };
    }

    if (data.length === 0) {
      warnings.push('Data array is empty');
    }

    data.forEach((record, index) => {
      if (typeof record !== 'object' || record === null) {
        errors.push(`Record ${index} is not a valid object`);
      } else {
        const keys = Object.keys(record);
        if (keys.length === 0) {
          warnings.push(`Record ${index} is empty`);
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      recordCount: data.length
    };
  }
}

export function createPreprocessor(
  pipeline: Array<(data: Record<string, any>[]) => Record<string, any>[]> = [],
  config: PreprocessorConfig = {}
): (data: Record<string, any>[]) => { data: Record<string, any>[]; validation: ValidationResult } {
  return (data: Record<string, any>[]) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!Array.isArray(data)) {
      errors.push('Input data must be an array');
      return {
        data: [],
        validation: { isValid: false, errors, warnings, recordCount: 0 }
      };
    }

    let processedData = [...data];

    if (config.maxRecords && processedData.length > config.maxRecords) {
      warnings.push(`Data truncated from ${processedData.length} to ${config.maxRecords} records`);
      processedData = processedData.slice(0, config.maxRecords);
    }

    for (const step of pipeline) {
      try {
        processedData = step(processedData);
      } catch (error) {
        errors.push(`Preprocessing step failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        break;
      }
    }

    if (config.requiredFields) {
      processedData.forEach((record, index) => {
        config.requiredFields!.forEach(field => {
          if (!(field in record) || record[field] === undefined || record[field] === null) {
            errors.push(`Record ${index} missing required field: ${field}`);
          }
        });
      });
    }

    const validation: ValidationResult = {
      isValid: errors.length === 0,
      errors,
      warnings,
      recordCount: processedData.length
    };

    return { data: processedData, validation };
  };
}

export const defaultPreprocessors = {
  removeNulls: (data: Record<string, any>[]) =>
    data.filter(record => Object.values(record).every(v => v !== null && v !== undefined)),

  trimStrings: (data: Record<string, any>[]) =>
    data.map(record => {
      const cleaned: Record<string, any> = {};
      for (const [key, value] of Object.entries(record)) {
        cleaned[key] = typeof value === 'string' ? value.trim() : value;
      }
      return cleaned;
    }),

  normalizeKeys: (data: Record<string, any>[]) =>
    data.map(record => {
      const normalized: Record<string, any> = {};
      for (const [key, value] of Object.entries(record)) {
        const normalizedKey = key.toLowerCase().replace(/\s+/g, '_');
        normalized[normalizedKey] = value;
      }
      return normalized;
    }),

  deduplicate: (data: Record<string, any>[]) => {
    const seen = new Set<string>();
    return data.filter(record => {
      const key = JSON.stringify(record);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
};
