import { useEffect } from 'react';

import ExpoScreenCapture from './ExpoScreenCapture';

/**
 * Prevents screen shots and screen recordings.
 * (On iOS, this will only prevent screen recordings)
 *
 * @example
 * ```typescript
 * activatePreventScreenCapture();
 * ```
 */
export function activatePreventScreenCapture() {
  return ExpoScreenCapture.activatePreventScreenCapture();
}

/**
 * Reallows screen shots and recordings. If you haven't called
 * `activatePreventScreenCapture()` yet, this method does nothing.
 *
 * @example
 * ```typescript
 * deactivatePreventScreenCapture();
 * ```
 */
export function deactivatePreventScreenCapture() {
  return ExpoScreenCapture.deactivatePreventScreenCapture();
}

/**
 * React hook for preventing screen capturing while the
 * component is mounted.
 *
 * @example
 * ```typescript
 * usePreventScreenCapture();
 * ```
 */
export function usePreventScreenCapture(): void {
  useEffect(() => {
    activatePreventScreenCapture();

    return () => {
      deactivatePreventScreenCapture();
    };
  }, []);
}
