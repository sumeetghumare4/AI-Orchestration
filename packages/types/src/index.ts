export interface ModelConfig {
  name: string;
  type: 'llm' | 'embedding' | 'classification';
  parameters: Record<string, unknown>;
}

export interface TrainingJob {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  modelId: string;
  createdAt: Date;
  completedAt?: Date;
  metrics?: Record<string, number>;
}

export interface Prompt {
  id: string;
  name: string;
  version: string;
  template: string;
  variables: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface EvaluationResult {
  jobId: string;
  metrics: {
    accuracy?: number;
    f1Score?: number;
    precision?: number;
    recall?: number;
    latencyMs?: number;
  };
  timestamp: Date;
}
