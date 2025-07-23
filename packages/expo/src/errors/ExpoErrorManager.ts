import type { ErrorHandlerCallback } from 'react-native';

export function createErrorHandler(originalHandler: ErrorHandlerCallback): ErrorHandlerCallback {
  return (error, isFatal) => originalHandler(error, isFatal);
}

/**
 * @hidden
 * @deprecated Will be removed in the future.
 */
export function disableErrorHandling() {}
