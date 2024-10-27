export function createErrorHandler(originalHandler) {
  return (error, isFatal) => originalHandler(error, isFatal);
}

/**
 * @hidden
 * @deprecated Will be removed in the future.
 */
export function disableErrorHandling() {}
