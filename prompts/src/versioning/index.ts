export interface PromptVersion {
  version: string;
  template: string;
  createdAt: Date;
  createdBy: string;
  changelog?: string;
  metadata?: Record<string, unknown>;
}

export interface VersionManagerConfig {
  maxVersionsPerPrompt?: number;
  autoIncrement?: boolean;
}

export class PromptVersionManager {
  private versions: Map<string, PromptVersion[]> = new Map();
  private config: VersionManagerConfig;

  constructor(config: VersionManagerConfig = {}) {
    this.config = {
      maxVersionsPerPrompt: config.maxVersionsPerPrompt ?? 100,
      autoIncrement: config.autoIncrement ?? true,
    };
  }

  createVersion(
    promptId: string,
    template: string,
    createdBy: string,
    changelog?: string,
    metadata?: Record<string, unknown>
  ): PromptVersion {
    const versions = this.versions.get(promptId) || [];

    if (versions.length >= this.config.maxVersionsPerPrompt!) {
      throw new Error(`Maximum versions (${this.config.maxVersionsPerPrompt}) reached for prompt ${promptId}`);
    }

    let versionNum: string;
    if (this.config.autoIncrement) {
      versionNum = (versions.length + 1).toString();
    } else {
      versionNum = `${Date.now()}`;
    }

    const version: PromptVersion = {
      version: versionNum,
      template,
      createdAt: new Date(),
      createdBy,
      changelog,
      metadata,
    };

    versions.push(version);
    this.versions.set(promptId, versions);
    return version;
  }

  getVersions(promptId: string): PromptVersion[] {
    return [...(this.versions.get(promptId) || [])].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
    );
  }

  getLatestVersion(promptId: string): PromptVersion | undefined {
    const versions = this.getVersions(promptId);
    return versions[versions.length - 1];
  }

  getVersion(promptId: string, version: string): PromptVersion | undefined {
    const versions = this.getVersions(promptId);
    return versions.find(v => v.version === version);
  }

  rollback(promptId: string, targetVersion: string): PromptVersion | undefined {
    const version = this.getVersion(promptId, targetVersion);
    if (!version) {
      return undefined;
    }

    const newVersion = this.createVersion(
      promptId,
      version.template,
      'system-rollback',
      `Rolled back to version ${targetVersion}`,
      { rolledBackFrom: version.version, ...version.metadata }
    );

    return newVersion;
  }

  deleteVersion(promptId: string, version: string): boolean {
    const versions = this.versions.get(promptId);
    if (!versions) return false;

    const index = versions.findIndex(v => v.version === version);
    if (index === -1) return false;

    versions.splice(index, 1);
    this.versions.set(promptId, versions);
    return true;
  }

  getVersionCount(promptId: string): number {
    return this.versions.get(promptId)?.length ?? 0;
  }

  clearPromptVersions(promptId: string): void {
    this.versions.delete(promptId);
  }

  listAllPrompts(): string[] {
    return Array.from(this.versions.keys());
  }

  exportVersions(promptId: string): PromptVersion[] {
    return this.getVersions(promptId);
  }

  importVersions(promptId: string, versions: PromptVersion[]): void {
    this.versions.set(promptId, [...versions].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
    ));
  }
}