export function createErrorHandler(originalHandler) {
  return (error, isFatal) => originalHandler(error, isFatal);
}

/**
 * @hidden
 * @deprecated Remove in the future.
 */
export function disableErrorHandling() {}
