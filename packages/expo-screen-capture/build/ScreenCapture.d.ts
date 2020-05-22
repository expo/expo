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
export declare function preventScreenCapture(): any;
/**
 * Reallows screenshots and recordings. If you haven't called
 * `preventScreenCapture()` yet, this method does nothing.
 *
 * @example
 * ```typescript
 * allowScreenCapture();
 * ```
 */
export declare function allowScreenCapture(): any;
/**
 * React hook for preventing screenshots and screen recordings
 * while the component is mounted.
 *
 * @example
 * ```typescript
 * usePreventScreenCapture();
 * ```
 */
export declare function usePreventScreenCapture(): void;
