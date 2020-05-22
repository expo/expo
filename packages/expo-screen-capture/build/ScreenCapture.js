import { useEffect } from 'react';
import ExpoScreenCapture from './ExpoScreenCapture';
/**
 * Prevents screenshots and screen recordings. If you are
 * already preventing screen capture, this method does nothing.
 *
 * On iOS, this will only prevent screen recordings, and is only
 * available on iOS 11 and newer. On older iOS versions, this method
 * does nothing.
 *
 * @example
 * ```typescript
 * preventScreenCapture();
 * ```
 */
export async function preventScreenCapture() {
    return ExpoScreenCapture.preventScreenCapture();
}
/**
 * Reallows screenshots and recordings. If you haven't called
 * `preventScreenCapture()` yet, this method does nothing.
 *
 * @example
 * ```typescript
 * allowScreenCapture();
 * ```
 */
export async function allowScreenCapture() {
    return ExpoScreenCapture.allowScreenCapture();
}
/**
 * React hook for preventing screenshots and screen recordings
 * while the component is mounted.
 *
 * @example
 * ```typescript
 * usePreventScreenCapture();
 * ```
 */
export function usePreventScreenCapture() {
    useEffect(() => {
        preventScreenCapture();
        return () => {
            allowScreenCapture();
        };
    }, []);
}
//# sourceMappingURL=ScreenCapture.js.map