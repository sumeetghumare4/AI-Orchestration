export interface ABTestVariant {
  id: string;
  promptId: string;
  version?: string;
  weight: number;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface ABTestMetrics {
  requests: number;
  successes: number;
  conversions: number;
  totalValue?: number;
  customMetrics?: Record<string, number>;
}

export interface ABTestResult {
  variantId: string;
  metric: string;
  value: number;
  timestamp: Date;
  context?: Record<string, unknown>;
}

export interface ABTestStats {
  variantId: string;
  sampleSize: number;
  mean: number;
  standardDeviation: number;
  confidenceInterval: [number, number];
}

export interface ABTestSummary {
  testId: string;
  name: string;
  startDate: Date;
  endDate?: Date;
  status: 'draft' | 'running' | 'paused' | 'completed';
  variants: {
    variantId: string;
    promptId: string;
    weight: number;
    metrics: ABTestMetrics;
    stats?: ABTestStats;
  }[];
  significanceResults?: Record<string, {
    significant: boolean;
    pValue: number;
    winner?: string;
  }>;
}

export class ABTestManager {
  private tests: Map<string, ABTest> = new Map();
  private results: Map<string, ABTestResult[]> = new Map();

  private calculateStandardDeviation(values: number[]): number {
    if (values.length < 2) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / (values.length - 1);
    return Math.sqrt(variance);
  }

  private calculateConfidenceInterval(mean: number, stdDev: number, n: number, confidence = 0.95): [number, number] {
    if (n < 2) return [mean, mean];
    // Using t-distribution approximation with z-score for simplicity
    const zScore = 1.96; // 95% confidence
    const margin = zScore * (stdDev / Math.sqrt(n));
    return [mean - margin, mean + margin];
  }

  private calculateZTest(sample1: number[], sample2: number[]): { zScore: number; pValue: number } {
    const n1 = sample1.length;
    const n2 = sample2.length;

    if (n1 === 0 || n2 === 0) {
      return { zScore: 0, pValue: 1 };
    }

    const mean1 = sample1.reduce((a, b) => a + b, 0) / n1;
    const mean2 = sample2.reduce((a, b) => a + b, 0) / n2;

    const stdDev1 = this.calculateStandardDeviation(sample1);
    const stdDev2 = this.calculateStandardDeviation(sample2);

    const pooledStdError = Math.sqrt(
      Math.pow(stdDev1, 2) / n1 + Math.pow(stdDev2, 2) / n2
    );

    if (pooledStdError === 0) {
      return { zScore: 0, pValue: 1 };
    }

    const zScore = (mean1 - mean2) / pooledStdError;

    // Approximate p-value using normal distribution
    // This is a simplified approximation
    const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore)));

    return { zScore, pValue };
  }

  private normalCDF(x: number): number {
    // Approximation of standard normal CDF
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x) / Math.sqrt(2);
    const t = 1 / (1 + p * x);
    const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return 0.5 * (1 + sign * y);
  }

  private calculateConversionRate(metrics: ABTestMetrics): number {
    if (metrics.requests === 0) return 0;
    return metrics.conversions / metrics.requests;
  }

  private calculateThroughput(metrics: ABTestMetrics): number {
    // Requests per unit time - simplified
    return metrics.requests;
  }

  private calculateSignificance(
    variants: { id: string; metrics: ABTestMetrics; values: number[] }[],
    metricName: string
  ): { significant: boolean; pValue: number; winner?: string } {
    if (variants.length < 2) {
      return { significant: false, pValue: 1 };
    }

    const control = variants[0];
    let bestVariant = control;
    let bestPValue = 1;
    let isSignificant = false;

    for (let i = 1; i < variants.length; i++) {
      const variant = variants[i];
      const { pValue } = this.calculateZTest(control.values, variant.values);

      if (pValue < bestPValue) {
        bestPValue = pValue;
        bestVariant = variant;
      }

      if (pValue < 0.05) {
        isSignificant = true;
      }
    }

    return {
      significant: isSignificant,
      pValue: bestPValue,
      winner: isSignificant ? bestVariant.id : undefined,
    };
  }

  createTest(id: string, name: string, variants: ABTestVariant[]): ABTest {
    if (variants.length < 2) {
      throw new Error('A/B test must have at least 2 variants');
    }

    const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
    if (totalWeight <= 0) {
      throw new Error('Total weight must be greater than 0');
    }

    const test: ABTest = {
      id,
      name,
      variants: [...variants],
      startDate: new Date(),
      metrics: [],
      status: 'draft',
    };

    this.tests.set(id, test);
    this.results.set(id, []);
    return test;
  }

  startTest(testId: string): ABTest | null {
    const test = this.tests.get(testId);
    if (!test) return null;

    test.status = 'running';
    test.startDate = new Date();
    return test;
  }

  pauseTest(testId: string): ABTest | null {
    const test = this.tests.get(testId);
    if (!test) return null;

    test.status = 'paused';
    return test;
  }

  completeTest(testId: string): ABTest | null {
    const test = this.tests.get(testId);
    if (!test) return null;

    test.status = 'completed';
    test.endDate = new Date();
    return test;
  }

  selectVariant(testId: string): ABTestVariant | null {
    const test = this.tests.get(testId);
    if (!test || test.status !== 'running') return null;

    const totalWeight = test.variants.reduce((sum, v) => sum + v.weight, 0);
    if (totalWeight <= 0) return test.variants[0];

    const random = Math.random() * totalWeight;
    let cumulative = 0;

    for (const variant of test.variants) {
      cumulative += variant.weight;
      if (random <= cumulative) {
        return variant;
      }
    }

    return test.variants[0];
  }

  selectVariantDeterministic(testId: string, userId: string): ABTestVariant | null {
    const test = this.tests.get(testId);
    if (!test || test.status !== 'running') return null;

    const totalWeight = test.variants.reduce((sum, v) => sum + v.weight, 0);
    if (totalWeight <= 0) return test.variants[0];

    // Deterministic hashing based on userId
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    const normalizedHash = Math.abs(hash) / Math.pow(2, 31);
    const random = normalizedHash * totalWeight;
    let cumulative = 0;

    for (const variant of test.variants) {
      cumulative += variant.weight;
      if (random <= cumulative) {
        return variant;
      }
    }

    return test.variants[0];
  }

  recordResult(
    testId: string,
    variantId: string,
    metric: string,
    value: number,
    context?: Record<string, unknown>
  ): void {
    const test = this.tests.get(testId);
    if (!test) {
      throw new Error(`Test ${testId} not found`);
    }

    const variant = test.variants.find(v => v.id === variantId);
    if (!variant) {
      throw new Error(`Variant ${variantId} not found in test ${testId}`);
    }

    const results = this.results.get(testId) || [];
    results.push({
      variantId,
      metric,
      value,
      timestamp: new Date(),
      context,
    });

    this.results.set(testId, results);
  }

  recordRequest(testId: string, variantId: string, success: boolean = true): void {
    this.recordResult(testId, variantId, 'request', success ? 1 : 0);
  }

  recordConversion(testId: string, variantId: string, value: number = 1): void {
    this.recordResult(testId, variantId, 'conversion', value);
  }

  recordCustomMetric(
    testId: string,
    variantId: string,
    metricName: string,
    value: number,
    context?: Record<string, unknown>
  ): void {
    this.recordResult(testId, variantId, metricName, value, context);
  }

  getTestMetrics(testId: string): Map<string, ABTestMetrics> {
    const test = this.tests.get(testId);
    if (!test) return new Map();

    const results = this.results.get(testId) || [];
    const metrics = new Map<string, ABTestMetrics>();

    for (const variant of test.variants) {
      const variantResults = results.filter(r => r.variantId === variant.id);
      const variantMetrics: ABTestMetrics = {
        requests: 0,
        successes: 0,
        conversions: 0,
        totalValue: 0,
        customMetrics: {},
      };

      for (const result of variantResults) {
        if (result.metric === 'request') {
          variantMetrics.requests += 1;
          if (result.value > 0) {
            variantMetrics.successes += 1;
          }
        } else if (result.metric === 'conversion') {
          variantMetrics.conversions += result.value;
          variantMetrics.totalValue = (variantMetrics.totalValue || 0) + result.value;
        } else {
          if (!variantMetrics.customMetrics) {
            variantMetrics.customMetrics = {};
          }
          variantMetrics.customMetrics[result.metric] =
            (variantMetrics.customMetrics[result.metric] || 0) + result.value;
        }
      }

      metrics.set(variant.id, variantMetrics);
    }

    return metrics;
  }

  getTestStats(testId: string): ABTestStats[] {
    const test = this.tests.get(testId);
    if (!test) return [];

    const results = this.results.get(testId) || [];
    const stats: ABTestStats[] = [];

    for (const variant of test.variants) {
      const variantResults = results.filter(r => r.variantId === variant.id);
      const values = variantResults.map(r => r.value);

      if (values.length === 0) {
        stats.push({
          variantId: variant.id,
          sampleSize: 0,
          mean: 0,
          standardDeviation: 0,
          confidenceInterval: [0, 0],
        });
        continue;
      }

      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const stdDev = this.calculateStandardDeviation(values);
      const confidenceInterval = this.calculateConfidenceInterval(mean, stdDev, values.length);

      stats.push({
        variantId: variant.id,
        sampleSize: values.length,
        mean,
        standardDeviation: stdDev,
        confidenceInterval,
      });
    }

    return stats;
  }

  getTestSummary(testId: string): ABTestSummary | null {
    const test = this.tests.get(testId);
    if (!test) return null;

    const metrics = this.getTestMetrics(testId);
    const stats = this.getTestStats(testId);
    const results = this.results.get(testId) || [];

    const variants = test.variants.map(variant => {
      const variantMetrics = metrics.get(variant.id) || {
        requests: 0,
        successes: 0,
        conversions: 0,
        totalValue: 0,
        customMetrics: {},
      };

      const variantStats = stats.find(s => s.variantId === variant.id);

      return {
        variantId: variant.id,
        promptId: variant.promptId,
        weight: variant.weight,
        metrics: variantMetrics,
        stats: variantStats,
      };
    });

    // Calculate significance for conversion rate
    const significanceResults: Record<string, { significant: boolean; pValue: number; winner?: string }> = {};

    const variantValues = test.variants.map(variant => {
      const variantResults = results.filter(r => r.variantId === variant.id && r.metric === 'conversion');
      return {
        id: variant.id,
        metrics: metrics.get(variant.id) || { requests: 0, successes: 0, conversions: 0, totalValue: 0, customMetrics: {} },
        values: variantResults.map(r => r.value),
      };
    });

    significanceResults.conversionRate = this.calculateSignificance(variantValues, 'conversionRate');

    return {
      testId: test.id,
      name: test.name,
      startDate: test.startDate,
      endDate: test.endDate,
      status: test.status as ABTestSummary['status'],
      variants,
      significanceResults,
    };
  }

  getAllTests(): ABTest[] {
    return Array.from(this.tests.values());
  }

  getTest(testId: string): ABTest | undefined {
    return this.tests.get(testId);
  }

  deleteTest(testId: string): boolean {
    const deleted = this.tests.delete(testId);
    this.results.delete(testId);
    return deleted;
  }

  updateVariantWeight(testId: string, variantId: string, newWeight: number): boolean {
    const test = this.tests.get(testId);
    if (!test) return false;

    const variant = test.variants.find(v => v.id === variantId);
    if (!variant) return false;

    if (newWeight < 0) return false;

    variant.weight = newWeight;
    return true;
  }

  isSignificant(testId: string, metric: string = 'conversionRate', confidence = 0.95): boolean {
    const summary = this.getTestSummary(testId);
    if (!summary || !summary.significanceResults) return false;

    const result = summary.significanceResults[metric];
    return result?.significant ?? false;
  }

  getWinner(testId: string, metric: string = 'conversionRate'): string | null {
    const summary = this.getTestSummary(testId);
    if (!summary || !summary.significanceResults) return null;

    const result = summary.significanceResults[metric];
    return result?.winner ?? null;
  }
}

export interface ABTest {
  id: string;
  name: string;
  variants: ABTestVariant[];
  startDate: Date;
  endDate?: Date;
  metrics: string[];
  status: 'draft' | 'running' | 'paused' | 'completed';
}
