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
export declare function preventScreenCaptureAsync(tag?: string): Promise<void>;
/**
 * Reallows screenshots and recordings. If you haven't called
 * `preventScreenCapture()` yet, this method does nothing.
 *
 * @example
 * ```typescript
 * allowScreenCaptureAsync();
 * ```
 */
export declare function allowScreenCaptureAsync(tag?: string): Promise<void>;
/**
 * React hook for preventing screenshots and screen recordings
 * while the component is mounted.
 *
 * @example
 * ```typescript
 * usePreventScreenCapture();
 * ```
 */
export declare function usePreventScreenCapture(tag?: string): void;
