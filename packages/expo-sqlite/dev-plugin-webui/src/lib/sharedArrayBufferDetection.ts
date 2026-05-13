/**
 * Detects if SharedArrayBuffer is supported in the current environment.
 * SharedArrayBuffer requires:
 * 1. Secure context (HTTPS or localhost)
 * 2. Cross-Origin-Embedder-Policy (COEP) headers
 * 3. Cross-Origin-Opener-Policy (COOP) headers
 * These are needed for SQLite WASM.
 */
export interface SharedArrayBufferDetectionResult {
  isSupported: boolean;
  isCrossOriginIsolated: boolean;
  hasSharedArrayBuffer: boolean;
  isSecureContext: boolean;
  currentHost: string;
  currentProtocol: string;
  isLocalhost: boolean;
}

/**
 * Checks if the current hostname is localhost.
 */
export function isLocalhost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

/**
 * Detects SharedArrayBuffer support in the current browser environment.
 */
export function isSharedArrayBufferSupported(): SharedArrayBufferDetectionResult {
  const isCrossOriginIsolated =
    typeof crossOriginIsolated !== 'undefined' && crossOriginIsolated === true;
  const hasSharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';
  const isSecureContext = typeof window !== 'undefined' ? window.isSecureContext : false;
  const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const currentProtocol = typeof window !== 'undefined' ? window.location.protocol : 'https:';
  const isLocalhostHost = isLocalhost(currentHost);

  return {
    isSupported: isCrossOriginIsolated && hasSharedArrayBuffer && isSecureContext,
    isCrossOriginIsolated,
    hasSharedArrayBuffer,
    isSecureContext,
    currentHost,
    currentProtocol,
    isLocalhost: isLocalhostHost,
  };
}

/**
 * Generates a localhost URL from the current URL.
 */
export function getLocalhostUrl(): string {
  if (typeof window === 'undefined') return '';

  const { protocol, port, pathname, search, hash } = window.location;
  return `${protocol}//localhost${port ? `:${port}` : ''}${pathname}${search}${hash}`;
}

/**
 * Checks if SharedArrayBuffer is supported and redirects to localhost if needed.
 * Returns true if redirect was performed, false otherwise.
 */
export function checkAndRedirectToLocalhost(): boolean {
  const detection = isSharedArrayBufferSupported();

  if (detection.isSupported || detection.isLocalhost) {
    return false;
  }

  const localhostUrl = getLocalhostUrl();
  if (localhostUrl && typeof window !== 'undefined') {
    window.location.href = localhostUrl;
    return true;
  }

  return false;
}
