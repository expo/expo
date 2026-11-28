import AppMetricsModule from './module';
import type { RecordMetricOptions } from './types';

/**
 * Records one value of a custom metric against the current main session. The value is exported to
 * Expo Observe with the next dispatch. Recording a metric never throws: when the metric can't be
 * recorded, a warning is logged.
 *
 * @param name Stable name of the metric, like `'checkout.payment_time'`. It must start with a
 * letter, have only letters, digits, `_`, `.`, `-` and `/`, have at most 255 characters, and must
 * not start with the reserved `expo.` prefix. Otherwise the metric is not recorded.
 * @param value The measured value. It must be a finite number. Otherwise the metric is not
 * recorded.
 * @param options The unit of the value and optional attributes.
 *
 * @example
 * ```ts
 * import { Observe } from 'expo-observe';
 *
 * Observe.recordMetric('checkout.payment_time', 1.42, { unit: 's' });
 * ```
 */
export function recordMetric(name: string, value: number, options?: RecordMetricOptions): void {
  try {
    AppMetricsModule.recordMetric(name, value, options);
  } catch (error) {
    console.warn('[expo-observe] recordMetric could not record the metric:', error);
  }
}
