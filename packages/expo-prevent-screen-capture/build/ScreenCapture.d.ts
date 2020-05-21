/**
 * Prevents screen shots and screen recordings.
 * (On iOS, this will only prevent screen recordings)
 *
 * @example
 * ```typescript
 * activatePreventScreenCapture();
 * ```
 */
export declare function activatePreventScreenCapture(): any;
/**
 * Reallows screen shots and recordings. If you haven't called
 * `activatePreventScreenCapture()` yet, this method does nothing.
 *
 * @example
 * ```typescript
 * deactivatePreventScreenCapture();
 * ```
 */
export declare function deactivatePreventScreenCapture(): any;
/**
 * React hook for preventing screen capturing while the
 * component is mounted.
 *
 * @example
 * ```typescript
 * usePreventScreenCapture();
 * ```
 */
export declare function usePreventScreenCapture(): void;
