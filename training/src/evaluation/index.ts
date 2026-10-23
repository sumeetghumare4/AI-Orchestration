export interface Metric {
  name: string;
  calculate(predictions: any[], groundTruth: any[]): number;
  getSummary?: (name: string) => string;
}

export interface MultiClassMetric {
  name: string;
  calculate(predictions: string[], groundTruth: string[]): Record<string, number>;
}

export class AccuracyMetric implements Metric {
  name = 'accuracy';

  calculate(predictions: any[], groundTruth: any[]): number {
    if (predictions.length !== groundTruth.length) return 0;
    if (predictions.length === 0) return 1;

    const correct = predictions.filter((p, i) => p === groundTruth[i]).length;
    return correct / predictions.length;
  }

  getSummary(name: string): string {
    return `Accuracy metric: ${name}`;
  }
}

export class F1Metric implements Metric {
  name = 'f1';

  calculate(predictions: any[], groundTruth: any[]): number {
    if (predictions.length !== groundTruth.length) return 0;
    if (predictions.length === 0) return 0;

    let tp = 0;
    let fp = 0;
    let fn = 0;

    predictions.forEach((p, i) => {
      const g = groundTruth[i];
      if (p === g) {
        tp++;
      } else {
        fp++;
        fn++;
      }
    });

    const precision = tp > 0 ? tp / (tp + fp) : 0;
    const recall = tp > 0 ? tp / (tp + fn) : 0;

    if (precision === 0 && recall === 0) return 0;

    return 2 * (precision * recall) / (precision + recall);
  }

  getSummary(name: string): string {
    return `F1 metric: ${name}`;
  }
}

export class PrecisionMetric implements Metric {
  name = 'precision';

  calculate(predictions: any[], groundTruth: any[]): number {
    if (predictions.length !== groundTruth.length) return 0;
    if (predictions.length === 0) return 1;

    let tp = 0;
    let fp = 0;

    predictions.forEach((p, i) => {
      if (p === groundTruth[i]) tp++;
      else {
        fp++;  // Count false positives correctly
      }
    });

    if (tp + fp === 0) return 1;
    return tp / (tp + fp);
  }

  getSummary(name: string): string {
    return `Precision metric: ${name}`;
  }
}

export class RecallMetric implements Metric {
  name = 'recall';

  calculate(predictions: any[], groundTruth: any[]): number {
    if (predictions.length !== groundTruth.length) return 0;
    if (predictions.length === 0) return 1;

    let tp = 0;
    let fn = 0;

    predictions.forEach((p, i) => {
      if (p === groundTruth[i]) tp++;
      else fn++;  // Count false negatives correctly
    });

    if (tp + fn === 0) return 1;
    return tp / (tp + fn);
  }

  getSummary(name: string): string {
    return `Recall metric: ${name}`;
  }
}

export class Evaluator {
  private metrics: Map<string, Metric> = new Map();
  private metricSummaries: Map<string, string> = new Map();

  addMetric(metric: Metric): void {
    this.metrics.set(metric.name, metric);
  }

  removeMetric(name: string): void {
    this.metrics.delete(name);
  }

  clearMetrics(): void {
    this.metrics.clear();
  }

  getMetrics(): ReadonlyMap<string, Metric> {
    return this.metrics;
  }

  addMetricSummary(name: string, summary: string): void {
    this.metricSummaries.set(name, summary);
  }

  evaluate(predictions: any[], groundTruth: any[]): Record<string, number> {
    if (!this.metrics.size) return {};

    const results: Record<string, number> = {};
    let hasError = false;

    this.metrics.forEach((metric, name) => {
      try {
        const score = metric.calculate(predictions, groundTruth);
        results[name] = score;
      } catch (error) {
        console.error(`Metric ${name} calculation error:`, error);
        results[name] = 0;
        hasError = true;
      }
    });

    if (hasError) {
      console.warn('Some metrics encountered errors during evaluation');
    }

    return results;
  }

  evaluateWithMetrics(
    predictions: any[],
    groundTruth: any[],
    metrics: Metric[]
  ): Record<string, number> {
    metrics.forEach(metric => this.addMetric(metric));
    return this.evaluate(predictions, groundTruth);
  }

  getSummary(): string {
    const summaries: string[] = [];

    this.metrics.forEach((metric, name) => {
      const summary = metric.getSummary?.(name) || `Metric: ${name}`;
      summaries.push(summary);
    });

    return summaries.join(', ');
  }

  getDetailedReport(predictions: any[], groundTruth: any[]): {
    metrics: Record<string, number>;
    overallAccuracy: number;
    totalSamples: number;
    perClassMetrics?: Record<string, Record<string, number>>;
  } {
    const totalSamples = predictions.length;
    const overallAccuracy = this.metrics.size > 0
      ? this.evaluate(predictions, groundTruth)[this.metrics.keys().next().value || '']
      : 0;

    const metrics = this.evaluate(predictions, groundTruth);

    return {
      metrics,
      overallAccuracy,
      totalSamples,
      perClassMetrics: this.calculatePerClassMetrics(predictions, groundTruth)
    };
  }

  private calculatePerClassMetrics(
    predictions: any[],
    groundTruth: any[]
  ): Record<string, Record<string, number>> {
    const classes = [...new Set([...predictions, ...groundTruth])];
    const report: Record<string, Record<string, number>> = {};

    classes.forEach(cls => {
      const tp = predictions.filter((p: any, i: number) => p === cls && groundTruth[i] === cls).length;
      const fp = predictions.filter((p: any, i: number) => p === cls && groundTruth[i] !== cls).length;
      const fn = groundTruth.filter((g: any, i: number) => g === cls && predictions[i] !== cls).length;

      const precision = tp > 0 ? tp / (tp + fp) : 0;
      const recall = tp > 0 ? tp / (tp + fn) : 0;
      const f1 = (precision + recall) > 0 ? 2 * precision * recall / (precision + recall) : 0;

      report[cls] = { precision, recall, f1 };
    });

    return report;
  }
}