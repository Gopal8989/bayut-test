import { Injectable } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';

interface Metric {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

interface Counter {
  name: string;
  value: number;
  tags?: Record<string, string>;
}

interface Histogram {
  name: string;
  values: number[];
  tags?: Record<string, string>;
}

@Injectable()
export class MetricsService {
  private metrics: Metric[] = [];
  private counters: Map<string, Counter> = new Map();
  private histograms: Map<string, Histogram> = new Map();
  private readonly maxMetrics = 10000;

  constructor(private readonly logger: LoggerService) {}

  /**
   * Record a metric
   */
  recordMetric(
    name: string,
    value: number,
    tags?: Record<string, string>,
  ): void {
    const metric: Metric = {
      name,
      value,
      timestamp: Date.now(),
      tags,
    };

    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    this.logger.debug(`Metric recorded: ${name}`, {
      context: 'MetricsService',
      name,
      value,
      tags,
    });
  }

  /**
   * Increment counter
   */
  incrementCounter(
    name: string,
    value: number = 1,
    tags?: Record<string, string>,
  ): void {
    const key = this.getCounterKey(name, tags);
    const counter = this.counters.get(key) || {
      name,
      value: 0,
      tags,
    };
    counter.value += value;
    this.counters.set(key, counter);

    this.logger.debug(`Counter incremented: ${name}`, {
      context: 'MetricsService',
      name,
      value: counter.value,
      tags,
    });
  }

  /**
   * Record histogram value
   */
  recordHistogram(
    name: string,
    value: number,
    tags?: Record<string, string>,
  ): void {
    const key = this.getHistogramKey(name, tags);
    const histogram = this.histograms.get(key) || {
      name,
      values: [],
      tags,
    };
    histogram.values.push(value);

    // Keep only recent values
    if (histogram.values.length > 1000) {
      histogram.values.shift();
    }

    this.histograms.set(key, histogram);
  }

  /**
   * Get metrics summary
   */
  getMetricsSummary(name?: string, tags?: Record<string, string>) {
    const filtered = name
      ? this.metrics.filter((m) => m.name === name)
      : this.metrics;

    if (filtered.length === 0) return null;

    const values = filtered.map((m) => m.value);
    return {
      name: name || 'all',
      count: values.length,
      sum: values.reduce((a, b) => a + b, 0),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }

  /**
   * Get counter value
   */
  getCounter(name: string, tags?: Record<string, string>): number {
    const key = this.getCounterKey(name, tags);
    return this.counters.get(key)?.value || 0;
  }

  /**
   * Get histogram stats
   */
  getHistogramStats(name: string, tags?: Record<string, string>) {
    const key = this.getHistogramKey(name, tags);
    const histogram = this.histograms.get(key);
    if (!histogram || histogram.values.length === 0) return null;

    const values = histogram.values;
    const sorted = [...values].sort((a, b) => a - b);

    return {
      name,
      count: values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      p50: this.percentile(sorted, 50),
      p95: this.percentile(sorted, 95),
      p99: this.percentile(sorted, 99),
    };
  }

  /**
   * Calculate percentile
   */
  private percentile(sorted: number[], p: number): number {
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Get counter key
   */
  private getCounterKey(name: string, tags?: Record<string, string>): string {
    const tagStr = tags ? JSON.stringify(tags) : '';
    return `${name}:${tagStr}`;
  }

  /**
   * Get histogram key
   */
  private getHistogramKey(name: string, tags?: Record<string, string>): string {
    const tagStr = tags ? JSON.stringify(tags) : '';
    return `${name}:${tagStr}`;
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics = [];
    this.counters.clear();
    this.histograms.clear();
    this.logger.info('Metrics reset', {
      context: 'MetricsService',
    });
  }
}

