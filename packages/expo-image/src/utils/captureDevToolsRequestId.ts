/**
 * A React Native DevTools request id for a download of `uri`, recorded with the caller's stack as its
 * initiator. Returns `undefined` for a source that is not a remote URL, and when network inspection
 * is not installed.
 */
export function captureDevToolsRequestId(uri: string | undefined): string | undefined {
  if (!uri || !/^https?:/i.test(uri)) {
    return undefined;
  }
  return globalThis.__NETWORK_REPORTER__?.createDevToolsRequestId();
}
