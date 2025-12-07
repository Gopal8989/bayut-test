import { Injectable } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';

interface QueueItem<T> {
  id: string;
  task: () => Promise<T>;
  priority: number;
  resolve: (value: T) => void;
  reject: (error: any) => void;
  timestamp: number;
}

@Injectable()
export class QueueService {
  private queues: Map<string, QueueItem<any>[]> = new Map();
  private processing: Map<string, boolean> = new Map();
  private concurrency: Map<string, number> = new Map();
  private maxQueueSize: Map<string, number> = new Map();

  constructor(private readonly logger: LoggerService) {}

  /**
   * Initialize queue with configuration
   */
  initializeQueue(
    queueName: string,
    concurrency: number = 5,
    maxSize: number = 1000,
  ): void {
    this.queues.set(queueName, []);
    this.processing.set(queueName, false);
    this.concurrency.set(queueName, concurrency);
    this.maxQueueSize.set(queueName, maxSize);
  }

  /**
   * Add task to queue
   */
  async enqueue<T>(
    queueName: string,
    task: () => Promise<T>,
    priority: number = 0,
  ): Promise<T> {
    if (!this.queues.has(queueName)) {
      this.initializeQueue(queueName);
    }

    const queue = this.queues.get(queueName)!;
    const maxSize = this.maxQueueSize.get(queueName)!;

    if (queue.length >= maxSize) {
      throw new Error(`Queue ${queueName} is full (max size: ${maxSize})`);
    }

    return new Promise<T>((resolve, reject) => {
      const item: QueueItem<T> = {
        id: Math.random().toString(36).substr(2, 9),
        task,
        priority,
        resolve,
        reject,
        timestamp: Date.now(),
      };

      // Insert based on priority (higher priority first)
      const index = queue.findIndex((q) => q.priority < priority);
      if (index === -1) {
        queue.push(item);
      } else {
        queue.splice(index, 0, item);
      }

      this.logger.debug(`Task enqueued: ${queueName}`, {
        context: 'QueueService',
        queueName,
        queueSize: queue.length,
        priority,
      });

      this.processQueue(queueName);
    });
  }

  /**
   * Process queue
   */
  private async processQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue || queue.length === 0) {
      return;
    }

    const isProcessing = this.processing.get(queueName);
    if (isProcessing) {
      return;
    }

    this.processing.set(queueName, true);
    const concurrency = this.concurrency.get(queueName)!;

    const workers: Promise<void>[] = [];
    let activeWorkers = 0;

    while (queue.length > 0 && activeWorkers < concurrency) {
      const item = queue.shift();
      if (!item) break;

      activeWorkers++;
      const worker = this.executeTask(queueName, item)
        .finally(() => {
          activeWorkers--;
          if (queue.length > 0 && activeWorkers < concurrency) {
            this.processQueue(queueName);
          } else if (activeWorkers === 0) {
            this.processing.set(queueName, false);
          }
        });

      workers.push(worker);
    }

    if (activeWorkers === 0) {
      this.processing.set(queueName, false);
    }
  }

  /**
   * Execute task
   */
  private async executeTask<T>(queueName: string, item: QueueItem<T>): Promise<void> {
    try {
      this.logger.debug(`Executing task: ${queueName}`, {
        context: 'QueueService',
        queueName,
        taskId: item.id,
      });

      const result = await item.task();
      item.resolve(result);

      this.logger.debug(`Task completed: ${queueName}`, {
        context: 'QueueService',
        queueName,
        taskId: item.id,
      });
    } catch (error: any) {
      this.logger.error(`Task failed: ${queueName}`, error.stack, {
        context: 'QueueService',
        queueName,
        taskId: item.id,
        error: error.message,
      });
      item.reject(error);
    }
  }

  /**
   * Get queue stats
   */
  getQueueStats(queueName: string) {
    const queue = this.queues.get(queueName);
    if (!queue) return null;

    return {
      name: queueName,
      size: queue.length,
      concurrency: this.concurrency.get(queueName),
      maxSize: this.maxQueueSize.get(queueName),
      isProcessing: this.processing.get(queueName),
    };
  }

  /**
   * Clear queue
   */
  clearQueue(queueName: string): void {
    const queue = this.queues.get(queueName);
    if (queue) {
      queue.forEach((item) => {
        item.reject(new Error('Queue cleared'));
      });
      queue.length = 0;
      this.logger.info(`Queue cleared: ${queueName}`, {
        context: 'QueueService',
      });
    }
  }
}

