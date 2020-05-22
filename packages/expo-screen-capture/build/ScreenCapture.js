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
 * preventScreenCaptureAsync();
 * ```
 */
export async function preventScreenCaptureAsync(tag = 'default') {
    await ExpoScreenCapture.preventScreenCapture(tag);
}
/**
 * Reallows screenshots and recordings. If you haven't called
 * `preventScreenCapture()` yet, this method does nothing.
 *
 * @example
 * ```typescript
 * allowScreenCaptureAsync();
 * ```
 */
export async function allowScreenCaptureAsync(tag = 'default') {
    await ExpoScreenCapture.allowScreenCapture(tag);
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
export function usePreventScreenCapture(tag = 'default') {
    useEffect(() => {
        preventScreenCaptureAsync(tag);
        return () => {
            allowScreenCaptureAsync(tag);
        };
    }, []);
}
//# sourceMappingURL=ScreenCapture.js.map