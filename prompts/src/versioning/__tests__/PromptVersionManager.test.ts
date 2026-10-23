// SPDX-License-Identifier: MIT
import { PromptVersionManager, PromptVersion } from '../index';

describe('PromptVersionManager', () => {
  let manager: PromptVersionManager;

  beforeEach(() => {
    manager = new PromptVersionManager();
  });

  describe('happy path', () => {
    test('should create first version', () => {
      const version = manager.createVersion('prompt-1', 'Template v1', 'user-1', 'Initial version');
      expect(version.version).toBe('1');
      expect(version.template).toBe('Template v1');
      expect(version.createdBy).toBe('user-1');
      expect(version.changelog).toBe('Initial version');
      expect(version.createdAt).toBeInstanceOf(Date);
    });

    test('should create sequential versions', () => {
      manager.createVersion('prompt-1', 'Template v1', 'user-1');
      manager.createVersion('prompt-1', 'Template v2', 'user-1');
      manager.createVersion('prompt-1', 'Template v3', 'user-1');

      const versions = manager.getVersions('prompt-1');
      expect(versions).toHaveLength(3);
      expect(versions[0].version).toBe('1');
      expect(versions[1].version).toBe('2');
      expect(versions[2].version).toBe('3');
    });

    test('should get latest version', () => {
      manager.createVersion('prompt-1', 'Template v1', 'user-1');
      manager.createVersion('prompt-1', 'Template v2', 'user-1');
      const latest = manager.getLatestVersion('prompt-1');
      expect(latest?.version).toBe('2');
      expect(latest?.template).toBe('Template v2');
    });

    test('should return undefined for non-existent prompt', () => {
      const latest = manager.getLatestVersion('non-existent');
      expect(latest).toBeUndefined();
    });

    test('should rollback to specific version', () => {
      manager.createVersion('prompt-1', 'Template v1', 'user-1');
      manager.createVersion('prompt-1', 'Template v2', 'user-1');
      manager.createVersion('prompt-1', 'Template v3', 'user-1');

      const rolledBack = manager.rollback('prompt-1', '2');
      expect(rolledBack?.version).toBe('2');
      expect(rolledBack?.template).toBe('Template v2');
    });

    test('should return undefined for non-existent version', () => {
      manager.createVersion('prompt-1', 'Template v1', 'user-1');
      const rolledBack = manager.rollback('prompt-1', '5');
      expect(rolledBack).toBeUndefined();
    });

    test('should handle versions for different prompts independently', () => {
      manager.createVersion('prompt-1', 'Template v1', 'user-1');
      manager.createVersion('prompt-1', 'Template v2', 'user-1');
      manager.createVersion('prompt-2', 'Template v1', 'user-1');

      expect(manager.getVersions('prompt-1')).toHaveLength(2);
      expect(manager.getVersions('prompt-2')).toHaveLength(1);
    });
  });

  describe('error cases', () => {
    test('should return empty array for non-existent prompt', () => {
      const versions = manager.getVersions('non-existent');
      expect(versions).toEqual([]);
    });

    test('should handle rollback for non-existent prompt', () => {
      const result = manager.rollback('non-existent', '1');
      expect(result).toBeUndefined();
    });

    test('should create version with no changelog', () => {
      const version = manager.createVersion('prompt-1', 'Template v1', 'user-1');
      expect(version.changelog).toBeUndefined();
    });
  });
});