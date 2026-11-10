import AppMetrics from 'expo-app-metrics';

import { warnIfUserContentEntryMissing } from './privacyManifestWarning';
import type { ObserveFeedback } from './types';

function invalidFeedbackReason(feedback: ObserveFeedback): string | null {
  if (typeof feedback !== 'object' || feedback === null) {
    return 'the argument must be an object';
  }
  const { id, message, rating } = feedback;
  if (typeof id !== 'string' || !id.trim()) {
    return '`id` must be a non-empty string';
  }
  if (message != null && typeof message !== 'string') {
    return '`message` must be a string';
  }
  if (rating != null && !(Number.isInteger(rating) && rating >= 0 && rating <= 10)) {
    return '`rating` must be a whole number from 0 to 10';
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
    const { message, ...rest } = feedback;
    AppMetrics.reportFeedback(message?.trim() ? feedback : rest);
    if (__DEV__) {
      warnIfUserContentEntryMissing();
    }
  } catch (error) {
    if (__DEV__) {
      console.warn('[expo-observe] `reportFeedback` failed to record the feedback:', error);
    }
  }
}
