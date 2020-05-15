import ExpoPreventScreenCapture from './ExpoPreventScreenCapture';
import { useEffect } from 'react';

/**
 * Prevent screen capture and recording
 *
 * @example
 * ```typescript
 * await activatePreventScreenCapture();
 * ```
 */
export async function activatePreventScreenCapture() {
  return await ExpoPreventScreenCapture.activatePreventScreenCapture();
}

/**
 * Reallow screen capture and recording. If you haven't called
 * `prevent()` yet, this method does nothing.
 *
 * @example
 * ```typescript
 * await deactivatePreventScreenCapture();
 * ```
 */
export async function deactivatePreventScreenCapture() {
  return await ExpoPreventScreenCapture.deactivatePreventScreenCapture();
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
