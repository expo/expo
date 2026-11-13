import AppMetrics from 'expo-app-metrics';

import type { ObserveFeedback } from './types';

const DEFAULT_SCALE = { min: 0, max: 10 };

function invalidFeedbackReason(feedback: ObserveFeedback): string | null {
  if (typeof feedback !== 'object' || feedback === null) {
    return 'the argument must be an object';
  }
  const { id, message, rating, scale } = feedback;
  if (typeof id !== 'string' || !id.trim()) {
    return '`id` must be a non-empty string';
  }
  if (message != null && typeof message !== 'string') {
    return '`message` must be a string';
  }
  if (rating != null) {
    // Safe integers also fit the native 64-bit integer types.
    if (!Number.isSafeInteger(rating)) {
      return '`rating` must be a whole number';
    }
    if (scale != null && !(Number.isSafeInteger(scale.min) && Number.isSafeInteger(scale.max))) {
      return '`scale.min` and `scale.max` must be whole numbers';
    }
    const { min, max } = scale ?? DEFAULT_SCALE;
    if (min >= max) {
      return '`scale.min` must be less than `scale.max`';
    }
    if (rating < min || rating > max) {
      return `\`rating\` must be from ${min} to ${max}`;
    }
  } else if (scale != null) {
    return 'set `rating` when you set `scale`';
  }
  if (!message?.trim() && rating == null) {
    return 'set `message` or `rating`';
  }
  return null;
}

/**
 * Validates the feedback and records it through the AppMetrics module. Never throws, like
 * `reportCaughtError`.
 */
export function reportFeedback(feedback: ObserveFeedback): void {
  try {
    const reason = invalidFeedbackReason(feedback);
    if (reason) {
      if (__DEV__) {
        console.warn(`[expo-observe] \`reportFeedback\` dropped the report: ${reason}.`);
      }
      return;
    }
    const { message, scale, ...rest } = feedback;
    const { min, max } = scale ?? DEFAULT_SCALE;
    AppMetrics.reportFeedback({
      ...rest,
      ...(message?.trim() ? { message } : null),
      // Sent with every rating, also the default one, so the dashboard can compare ratings.
      ...(rest.rating != null ? { scaleMin: min, scaleMax: max } : null),
    });
  } catch (error) {
    if (__DEV__) {
      console.warn('[expo-observe] `reportFeedback` failed to record the feedback:', error);
    }
  }
}
