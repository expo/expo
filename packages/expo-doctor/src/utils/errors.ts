export function isNetworkError(error: any): boolean {
  if (error instanceof Error) {
    // 1. look for explicit ENOTFOUND
    if (
      error.cause &&
      typeof error.cause === 'object' &&
      'code' in error.cause &&
      typeof error.cause.code === 'string' &&
      error.cause.code === 'ENOTFOUND'
    ) {
      return true;
    }
    // 2. look for generic network error message
    return error.message.includes('fetch failed');
  }
  return false;
}
