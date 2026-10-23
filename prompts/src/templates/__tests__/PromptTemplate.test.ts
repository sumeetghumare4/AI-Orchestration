// SPDX-License-Identifier: MIT
import { PromptTemplate, TemplateVariable } from '../index';

describe('PromptTemplate', () => {
  const variables: TemplateVariable[] = [
    { name: 'user', type: 'string', required: true },
    { name: 'age', type: 'number', required: false, default: 25 },
    { name: 'active', type: 'boolean', required: true }
  ];

  let template: PromptTemplate;

  beforeEach(() => {
    template = new PromptTemplate(
      'template-1',
      'Test Template',
      'Hello {{user}}, you are {{age}} years old. Active: {{active}}',
      variables
    );
  });

  describe('happy path', () => {
    test('should render template with all variables', () => {
      const result = template.render({ user: 'Alice', age: 30, active: true });
      expect(result).toBe('Hello Alice, you are 30 years old. Active: true');
    });

    test('should use default values for optional variables', () => {
      const result = template.render({ user: 'Bob', active: false });
      expect(result).toBe('Hello Bob, you are 25 years old. Active: false');
    });

    test('should handle multiple occurrences of same variable', () => {
      const multiTemplate = new PromptTemplate(
        'multi',
        'Multi',
        '{{user}} says: {{user}}',
        [{ name: 'user', type: 'string', required: true }]
      );
      const result = multiTemplate.render({ user: 'Charlie' });
      expect(result).toBe('Charlie says: Charlie');
    });

    test('should validate valid input', () => {
      const errors = template.validate({ user: 'Alice', age: 30, active: true });
      expect(errors).toHaveLength(0);
    });

    test('should handle extra variables gracefully', () => {
      const result = template.render({ user: 'Alice', age: 30, active: true, extra: 'ignored' });
      expect(result).toBe('Hello Alice, you are 30 years old. Active: true');
    });
  });

  describe('error cases', () => {
    test('should return error for missing required variable', () => {
      const errors = template.validate({ age: 30, active: true });
      expect(errors).toContain('Required variable missing: user');
    });

    test('should return error for missing required boolean variable', () => {
      const errors = template.validate({ user: 'Alice', age: 30 });
      expect(errors).toContain('Required variable missing: active');
    });

    test('should return multiple errors for multiple missing required variables', () => {
      const errors = template.validate({});
      expect(errors).toContain('Required variable missing: user');
      expect(errors).toContain('Required variable missing: active');
    });

    test('should handle undefined values in render', () => {
      const result = template.render({ user: 'Alice', age: undefined, active: true });
      expect(result).toBe('Hello Alice, you are undefined years old. Active: true');
    });
  });
});