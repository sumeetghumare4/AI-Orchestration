export type VariableType = 'string' | 'number' | 'boolean' | 'array' | 'object';

export interface TemplateVariable {
  name: string;
  type: VariableType;
  required: boolean;
  default?: unknown;
  description?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    enum?: unknown[];
  };
}

export interface PromptTemplateConfig {
  id: string;
  name: string;
  template: string;
  variables: TemplateVariable[];
  description?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface RenderResult {
  output: string;
  warnings: string[];
  missingVariables: string[];
}

export class PromptTemplate {
  id: string;
  name: string;
  template: string;
  variables: TemplateVariable[];
  description?: string;
  tags: string[];
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;

  constructor(config: PromptTemplateConfig) {
    this.id = config.id;
    this.name = config.name;
    this.template = config.template;
    this.variables = config.variables;
    this.description = config.description;
    this.tags = config.tags ?? [];
    this.metadata = config.metadata ?? {};
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  private validateValue(variable: TemplateVariable, value: unknown): string[] {
    const errors: string[] = [];

    if (variable.required && (value === undefined || value === null)) {
      errors.push(`Required variable missing: ${variable.name}`);
      return errors;
    }

    if (value === undefined || value === null) {
      return errors;
    }

    switch (variable.type) {
      case 'string':
        if (typeof value !== 'string') {
          errors.push(`Variable ${variable.name} must be a string`);
        }
        break;
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          errors.push(`Variable ${variable.name} must be a number`);
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push(`Variable ${variable.name} must be a boolean`);
        }
        break;
      case 'array':
        if (!Array.isArray(value)) {
          errors.push(`Variable ${variable.name} must be an array`);
        }
        break;
      case 'object':
        if (typeof value !== 'object' || Array.isArray(value) || value === null) {
          errors.push(`Variable ${variable.name} must be an object`);
        }
        break;
    }

    if (variable.validation) {
      if (variable.type === 'number' && typeof value === 'number') {
        if (variable.validation.min !== undefined && value < variable.validation.min) {
          errors.push(`Variable ${variable.name} must be >= ${variable.validation.min}`);
        }
        if (variable.validation.max !== undefined && value > variable.validation.max) {
          errors.push(`Variable ${variable.name} must be <= ${variable.validation.max}`);
        }
      }
      if (variable.type === 'string' && typeof value === 'string') {
        if (variable.validation.pattern) {
          const regex = new RegExp(variable.validation.pattern);
          if (!regex.test(value)) {
            errors.push(`Variable ${variable.name} does not match pattern: ${variable.validation.pattern}`);
          }
        }
        if (variable.validation.enum && !variable.validation.enum.includes(value)) {
          errors.push(`Variable ${variable.name} must be one of: ${variable.validation.enum.join(', ')}`);
        }
      }
    }

    return errors;
  }

  render(values: Record<string, unknown>): RenderResult {
    const warnings: string[] = [];
    const missingVariables: string[] = [];
    let output = this.template;

    // Find all variable placeholders in template
    const placeholderRegex = /\{\{(\w+)\}\}/g;
    const placeholders = new Set<string>();
    let match;
    while ((match = placeholderRegex.exec(this.template)) !== null) {
      placeholders.add(match[1]);
    }

    // Check for missing required variables
    for (const variable of this.variables) {
      if (variable.required && !(variable.name in values)) {
        if (variable.default !== undefined) {
          values[variable.name] = variable.default;
        } else {
          missingVariables.push(variable.name);
        }
      }
    }

    // Validate all provided values
    for (const [key, value] of Object.entries(values)) {
      const variable = this.variables.find(v => v.name === key);
      if (variable) {
        const errors = this.validateValue(variable, value);
        if (errors.length > 0) {
          warnings.push(...errors);
        }
      } else {
        warnings.push(`Unknown variable provided: ${key}`);
      }
    }

    // Check for unused template variables
    for (const placeholder of placeholders) {
      if (!(placeholder in values)) {
        const variable = this.variables.find(v => v.name === placeholder);
        if (variable && variable.default !== undefined) {
          values[placeholder] = variable.default;
        } else if (!missingVariables.includes(placeholder)) {
          missingVariables.push(placeholder);
        }
      }
    }

    // Perform interpolation
    for (const [key, value] of Object.entries(values)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      const stringValue = value === null || value === undefined ? '' : String(value);
      output = output.replace(regex, stringValue);
    }

    return { output, warnings, missingVariables };
  }

  validate(values: Record<string, unknown>): string[] {
    const errors: string[] = [];

    for (const variable of this.variables) {
      const value = values[variable.name];
      const validationErrors = this.validateValue(variable, value);
      errors.push(...validationErrors);
    }

    return errors;
  }

  getRequiredVariables(): string[] {
    return this.variables
      .filter(v => v.required)
      .map(v => v.name);
  }

  getOptionalVariables(): string[] {
    return this.variables
      .filter(v => !v.required)
      .map(v => v.name);
  }

  getAllVariables(): string[] {
    return this.variables.map(v => v.name);
  }

  updateTemplate(newTemplate: string): void {
    this.template = newTemplate;
    this.updatedAt = new Date();
  }

  addVariable(variable: TemplateVariable): void {
    if (this.variables.some(v => v.name === variable.name)) {
      throw new Error(`Variable ${variable.name} already exists`);
    }
    this.variables.push(variable);
    this.updatedAt = new Date();
  }

  removeVariable(name: string): boolean {
    const index = this.variables.findIndex(v => v.name === name);
    if (index === -1) return false;
    this.variables.splice(index, 1);
    this.updatedAt = new Date();
    return true;
  }

  clone(newId: string, newName: string): PromptTemplate {
    return new PromptTemplate({
      id: newId,
      name: newName,
      template: this.template,
      variables: [...this.variables],
      description: this.description,
      tags: [...this.tags],
      metadata: { ...this.metadata },
    });
  }

  toJSON(): PromptTemplateConfig & { createdAt: string; updatedAt: string } {
    return {
      id: this.id,
      name: this.name,
      template: this.template,
      variables: this.variables,
      description: this.description,
      tags: this.tags,
      metadata: this.metadata,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }

  static fromJSON(json: PromptTemplateConfig & { createdAt?: string; updatedAt?: string }): PromptTemplate {
    const template = new PromptTemplate(json);
    if (json.createdAt) template.createdAt = new Date(json.createdAt);
    if (json.updatedAt) template.updatedAt = new Date(json.updatedAt);
    return template;
  }
}

export function createTemplate(config: PromptTemplateConfig): PromptTemplate {
  return new PromptTemplate(config);
}

export function extractVariables(template: string): string[] {
  const regex = /\{\{(\w+)\}\}/g;
  const variables = new Set<string>();
  let match;
  while ((match = regex.exec(template)) !== null) {
    variables.add(match[1]);
  }
  return Array.from(variables);
}