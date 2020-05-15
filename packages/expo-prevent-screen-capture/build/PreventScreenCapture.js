import ExpoPreventScreenCapture from './ExpoPreventScreenCapture';
import { useEffect } from 'react';
/**
 * Prevent screen capture and recording
 *
 * @example
 * ```typescript
 * activatePreventScreenCapture();
 * ```
 */
export function activatePreventScreenCapture() {
    return ExpoPreventScreenCapture.activatePreventScreenCapture();
}
/**
 * Reallow screen capture and recording. If you haven't called
 * `prevent()` yet, this method does nothing.
 *
 * @example
 * ```typescript
 * deactivatePreventScreenCapture();
 * ```
 */
export function deactivatePreventScreenCapture() {
    return ExpoPreventScreenCapture.deactivatePreventScreenCapture();
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
export function usePreventScreenCapture() {
    useEffect(() => {
        activatePreventScreenCapture();
        return () => {
            deactivatePreventScreenCapture();
        };
    }, []);
}
//# sourceMappingURL=PreventScreenCapture.js.map