import { ModelConfig } from '../../packages/types/src';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface ModelTrainer<T = any> {
  config: ModelConfig;
  train(data: T[]): Promise<TrainingResult>;
  save(path?: string): Promise<string>;
  load(path: string): Promise<void>;
}

export interface TrainingResult {
  epochsCompleted: number;
  finalLoss: number;
  metrics: Record<string, number>;
  durationMs: number;
  checkpointPath?: string;
}

export interface TrainingConfig {
  batchSize?: number;
  epochs?: number;
  learningRate?: number;
  validationSplit?: number;
  earlyStoppingPatience?: number;
}

export class BaseTrainer implements ModelTrainer {
  config: ModelConfig;
  private trainingConfig: Required<TrainingConfig>;
  private isTraining = false;
  private checkpointsDir: string;

  constructor(config: ModelConfig, trainingConfig: TrainingConfig = {}) {
    this.config = config;
    this.trainingConfig = {
      batchSize: trainingConfig.batchSize ?? 32,
      epochs: trainingConfig.epochs ?? 10,
      learningRate: trainingConfig.learningRate ?? 0.001,
      validationSplit: trainingConfig.validationSplit ?? 0.2,
      earlyStoppingPatience: trainingConfig.earlyStoppingPatience ?? 3
    };
    this.checkpointsDir = path.join(process.cwd(), 'checkpoints', config.name);
  }

  async train(data: T[]): Promise<TrainingResult> {
    if (this.isTraining) {
      throw new Error('Training already in progress');
    }

    if (!data || data.length === 0) {
      throw new Error('Training data cannot be empty');
    }

    this.isTraining = true;
    const startTime = Date.now();

    try {
      console.log(`Starting training for ${this.config.name} with ${data.length} samples`);
      console.log(`Config: ${JSON.stringify(this.config.parameters)}`);
      console.log(`Training config: ${JSON.stringify(this.trainingConfig)}`);

      await this.ensureCheckpointsDir();

      const { trainData, validationData } = this.splitData(data, this.trainingConfig.validationSplit);

      let bestValidationLoss = Infinity;
      let patienceCounter = 0;
      let finalLoss = 0;
      const metrics: Record<string, number> = {};

      for (let epoch = 0; epoch < this.trainingConfig.epochs; epoch++) {
        console.log(`Epoch ${epoch + 1}/${this.trainingConfig.epochs}`);

        const epochResult = await this.trainEpoch(trainData, epoch);
        finalLoss = epochResult.loss;

        const validationResult = await this.validate(validationData);
        metrics[`epoch_${epoch + 1}_loss`] = finalLoss;
        metrics[`epoch_${epoch + 1}_val_loss`] = validationResult.loss;

        console.log(`  Train Loss: ${finalLoss.toFixed(4)}, Val Loss: ${validationResult.loss.toFixed(4)}`);

        if (validationResult.loss < bestValidationLoss) {
          bestValidationLoss = validationResult.loss;
          patienceCounter = 0;
          await this.saveCheckpoint(epoch, finalLoss);
        } else {
          patienceCounter++;
          if (patienceCounter >= this.trainingConfig.earlyStoppingPatience) {
            console.log(`Early stopping triggered after ${epoch + 1} epochs`);
            break;
          }
        }

        await this.onEpochEnd(epoch, { loss: finalLoss, validationLoss: validationResult.loss });
      }

      const durationMs = Date.now() - startTime;
      const checkpointPath = await this.save();

      return {
        epochsCompleted: this.trainingConfig.epochs,
        finalLoss,
        metrics,
        durationMs,
        checkpointPath
      };
    } finally {
      this.isTraining = false;
    }
  }

  async save(filePath?: string): Promise<string> {
    const savePath = filePath || path.join(this.checkpointsDir, `${this.config.name}_final.json`);

    const modelState = {
      config: this.config,
      timestamp: new Date().toISOString(),
      trainingConfig: this.trainingConfig,
      metadata: {
        type: this.config.type,
        version: '1.0.0'
      }
    };

    await fs.mkdir(path.dirname(savePath), { recursive: true });
    await fs.writeFile(savePath, JSON.stringify(modelState, null, 2));

    console.log(`Model saved to ${savePath}`);
    return savePath;
  }

  async load(filePath: string): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const modelState = JSON.parse(content);

      this.config = modelState.config;
      console.log(`Model ${this.config.name} loaded from ${filePath}`);
    } catch (error) {
      throw new Error(`Failed to load model: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  protected async trainEpoch(data: any[], epoch: number): Promise<{ loss: number }> {
    const batches = this.createBatches(data, this.trainingConfig.batchSize);
    let totalLoss = 0;

    for (const batch of batches) {
      const batchLoss = await this.trainBatch(batch, epoch);
      totalLoss += batchLoss;
    }

    return { loss: totalLoss / batches.length };
  }

  protected async validate(data: any[]): Promise<{ loss: number }> {
    if (data.length === 0) return { loss: 0 };

    const batches = this.createBatches(data, this.trainingConfig.batchSize);
    let totalLoss = 0;

    for (const batch of batches) {
      const batchLoss = await this.validateBatch(batch);
      totalLoss += batchLoss;
    }

    return { loss: totalLoss / batches.length };
  }

  protected async saveCheckpoint(epoch: number, loss: number): Promise<string> {
    const checkpointPath = path.join(
      this.checkpointsDir,
      `checkpoint_epoch_${epoch + 1}_loss_${loss.toFixed(4)}.json`
    );

    const checkpoint = {
      epoch,
      loss,
      config: this.config,
      timestamp: new Date().toISOString()
    };

    await fs.writeFile(checkpointPath, JSON.stringify(checkpoint, null, 2));
    console.log(`Checkpoint saved: ${checkpointPath}`);
    return checkpointPath;
  }

  protected async onEpochEnd(epoch: number, metrics: Record<string, number>): Promise<void> {
  }

  protected splitData(data: any[], validationSplit: number): { trainData: any[]; validationData: any[] } {
    const splitIndex = Math.floor(data.length * (1 - validationSplit));
    return {
      trainData: data.slice(0, splitIndex),
      validationData: data.slice(splitIndex)
    };
  }

  protected createBatches(data: any[], batchSize: number): any[][] {
    const batches: any[][] = [];
    for (let i = 0; i < data.length; i += batchSize) {
      batches.push(data.slice(i, i + batchSize));
    }
    return batches;
  }

  protected async trainBatch(batch: any[], epoch: number): Promise<number> {
    // No artificial delay for performance; simulate async work if needed
    return Math.random() * 0.5 + 0.1;
  }

  protected async validateBatch(batch: any[]): Promise<number> {
    // No artificial delay for performance
    return Math.random() * 0.3 + 0.05;
  }

  private async simulateTraining(batchSize: number): Promise<void> {
    const delay = Math.max(10, batchSize * 0.5);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  private async simulateValidation(batchSize: number): Promise<void> {
    const delay = Math.max(5, batchSize * 0.2);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  private async ensureCheckpointsDir(): Promise<void> {
    await fs.mkdir(this.checkpointsDir, { recursive: true });
  }
}

export class LLMTrainer extends BaseTrainer {
  private contextLength = 2048;
  private tokenizer: any = null;

  constructor(config: ModelConfig, trainingConfig: TrainingConfig = {}) {
    super(config, {
      ...trainingConfig,
      batchSize: trainingConfig.batchSize ?? 4,
      epochs: trainingConfig.epochs ?? 3
    });
  }

  async train(data: any[]): Promise<TrainingResult> {
    console.log(`Training LLM ${this.config.name} with ${data.length} samples`);
    console.log(`Context length: ${this.contextLength}`);

    if (!this.validateLLMData(data)) {
      throw new Error('LLM training data must contain text samples');
    }

    return super.train(data);
  }

  protected async trainBatch(batch: any[], epoch: number): Promise<number> {
    const processedBatch = batch.map(item => ({
      ...item,
      tokens: this.tokenize(item.text || item.content || '')
    }));

    await this.simulateTraining(processedBatch.length * 2);

    const loss = Math.max(0.01, 2.0 * Math.exp(-epoch * 0.3) + Math.random() * 0.1);
    return loss;
  }

  protected async validateBatch(batch: any[]): Promise<number> {
    await this.simulateValidation(batch.length * 1.5);
    return Math.random() * 0.2 + 0.05;
  }

  private tokenize(text: string): number[] {
    return text.split(' ').map(() => Math.floor(Math.random() * 1000));
  }

  private validateLLMData(data: any[]): boolean {
    return data.every(item =>
      typeof item === 'object' &&
      (item.text || item.content || item.prompt)
    );
  }
}

export class ClassificationTrainer extends BaseTrainer {
  async train(data: any[]): Promise<TrainingResult> {
    console.log(`Training Classifier ${this.config.name}`);
    return super.train(data);
  }

  protected async trainBatch(batch: any[], epoch: number): Promise<number> {
    await this.simulateTraining(batch.length);
    const loss = Math.max(0.01, 1.5 * Math.exp(-epoch * 0.4) + Math.random() * 0.05);
    return loss;
  }
}
