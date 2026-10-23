import { Model, Prompt, Dataset, TrainingJob, User } from '../types';
import { v4 as uuidv4 } from 'uuid';

// In-memory data store for development
// In production, this would be replaced with a database

class DataStore {
  private models: Map<string, Model> = new Map();
  private prompts: Map<string, Prompt> = new Map();
  private datasets: Map<string, Dataset> = new Map();
  private trainingJobs: Map<string, TrainingJob> = new Map();
  private users: Map<string, User> = new Map();

  constructor() {
    this.initializeSampleData();
  }

  private initializeSampleData(): void {
    // Sample models
    const model1: Model = {
      id: 'model-1',
      name: 'GPT-3.5 Turbo',
      type: 'llm',
      parameters: { temperature: 0.7, maxTokens: 4096 },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.models.set(model1.id, model1);

    // Sample prompts
    const prompt1: Prompt = {
      id: 'prompt-1',
      name: 'Summarization Prompt',
      version: '1.0.0',
      template: 'Summarize the following text in {max_length} words:\n\n{text}',
      variables: ['max_length', 'text'],
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
    };
    this.prompts.set(prompt1.id, prompt1);

    // Sample dataset
    const dataset1: Dataset = {
      id: 'dataset-1',
      name: 'Sample Training Data',
      type: 'text',
      description: 'Sample dataset for training',
      size: 1000,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.datasets.set(dataset1.id, dataset1);

    // Sample user
    const user1: User = {
      id: 'user-1',
      username: 'admin',
      email: 'admin@example.com',
      createdAt: new Date(),
    };
    this.users.set(user1.id, user1);
  }

  // Models
  getAllModels(): Model[] {
    return Array.from(this.models.values());
  }

  getModel(id: string): Model | undefined {
    return this.models.get(id);
  }

  createModel(data: Omit<Model, 'id' | 'createdAt' | 'updatedAt'>): Model {
    const model: Model = {
      ...data,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.models.set(model.id, model);
    return model;
  }

  updateModel(id: string, data: Partial<Model>): Model | undefined {
    const model = this.models.get(id);
    if (!model) return undefined;

    const updated = { ...model, ...data, updatedAt: new Date() };
    this.models.set(id, updated);
    return updated;
  }

  deleteModel(id: string): boolean {
    return this.models.delete(id);
  }

  // Prompts
  getAllPrompts(): Prompt[] {
    return Array.from(this.prompts.values());
  }

  getPrompt(id: string): Prompt | undefined {
    return this.prompts.get(id);
  }

  createPrompt(data: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt'>): Prompt {
    const prompt: Prompt = {
      ...data,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.prompts.set(prompt.id, prompt);
    return prompt;
  }

  updatePrompt(id: string, data: Partial<Prompt>): Prompt | undefined {
    const prompt = this.prompts.get(id);
    if (!prompt) return undefined;

    const updated = { ...prompt, ...data, updatedAt: new Date() };
    this.prompts.set(id, updated);
    return updated;
  }

  deletePrompt(id: string): boolean {
    return this.prompts.delete(id);
  }

  // Datasets
  getAllDatasets(): Dataset[] {
    return Array.from(this.datasets.values());
  }

  getDataset(id: string): Dataset | undefined {
    return this.datasets.get(id);
  }

  createDataset(data: Omit<Dataset, 'id' | 'createdAt' | 'updatedAt'>): Dataset {
    const dataset: Dataset = {
      ...data,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.datasets.set(dataset.id, dataset);
    return dataset;
  }

  updateDataset(id: string, data: Partial<Dataset>): Dataset | undefined {
    const dataset = this.datasets.get(id);
    if (!dataset) return undefined;

    const updated = { ...dataset, ...data, updatedAt: new Date() };
    this.datasets.set(id, updated);
    return updated;
  }

  deleteDataset(id: string): boolean {
    return this.datasets.delete(id);
  }

  // Training Jobs
  getAllTrainingJobs(): TrainingJob[] {
    return Array.from(this.trainingJobs.values());
  }

  getTrainingJob(id: string): TrainingJob | undefined {
    return this.trainingJobs.get(id);
  }

  createTrainingJob(data: Omit<TrainingJob, 'id' | 'createdAt'>): TrainingJob {
    const job: TrainingJob = {
      ...data,
      id: uuidv4(),
      createdAt: new Date(),
    };
    this.trainingJobs.set(job.id, job);

    // Simulate training process
    this.simulateTraining(job.id);

    return job;
  }

  updateTrainingJob(id: string, data: Partial<TrainingJob>): TrainingJob | undefined {
    const job = this.trainingJobs.get(id);
    if (!job) return undefined;

    const updated = { ...job, ...data };
    this.trainingJobs.set(id, updated);
    return updated;
  }

  deleteTrainingJob(id: string): boolean {
    return this.trainingJobs.delete(id);
  }

  private async simulateTraining(jobId: string): Promise<void> {
    setTimeout(() => {
      this.updateTrainingJob(jobId, { status: 'running', startedAt: new Date() });

      setTimeout(() => {
        this.updateTrainingJob(jobId, {
          status: 'completed',
          completedAt: new Date(),
          metrics: {
            accuracy: Math.random() * 0.5 + 0.5,
            loss: Math.random() * 0.5,
          },
        });
      }, 5000);
    }, 1000);
  }

  // Users
  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  getUser(id: string): User | undefined {
    return this.users.get(id);
  }

  getUserByUsername(username: string): User | undefined {
    return Array.from(this.users.values()).find(u => u.username === username);
  }

  createUser(data: Omit<User, 'id' | 'createdAt'>): User {
    const user: User = {
      ...data,
      id: uuidv4(),
      createdAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }
}

export const dataStore = new DataStore();
