import ExpoPreventScreenshot from './ExpoPreventScreenshot';
import { useEffect } from 'react';

/**
 * Prevent screen capture and recording
 *
 * @example
 * ```typescript
 * await activatePreventScreenshot();
 * ```
 */
export async function activatePreventScreenshot() {
  return await ExpoPreventScreenshot.activatePreventScreenshot();
}

/**
 * Reallow screen capture and recording. If you haven't called
 * `prevent()` yet, this method does nothing.
 *
 * @example
 * ```typescript
 * await deactivatePreventScreenshot();
 * ```
 */
export async function deactivatePreventScreenshot() {
  return await ExpoPreventScreenshot.deactivatePreventScreenshot();
}

/**
 * React hook for preventing screen capturing while the
 * component is mounted.
 *
 * @example
 * ```typescript
 * usePreventScreenshot();
 * ```
 */
export function usePreventScreenshot(): void {
  useEffect(() => {
    activatePreventScreenshot();

    return () => {
      deactivatePreventScreenshot();
    };
  }, []);
}
