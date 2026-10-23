export interface Model {
  id: string;
  name: string;
  type: 'llm' | 'embedding' | 'classification';
  parameters: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Prompt {
  id: string;
  name: string;
  version: string;
  template: string;
  variables: string[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface Dataset {
  id: string;
  name: string;
  type: 'text' | 'image' | 'tabular';
  description?: string;
  size: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrainingJob {
  id: string;
  modelId: string;
  datasetId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  parameters: Record<string, unknown>;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  metrics?: Record<string, number>;
  error?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: Date;
}

export interface AuthenticatedRequest {
  user?: User;
}
