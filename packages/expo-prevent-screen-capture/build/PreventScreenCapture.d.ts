/**
 * Prevent screen capture and recording
 *
 * @example
 * ```typescript
 * activatePreventScreenCapture();
 * ```
 */
export declare function activatePreventScreenCapture(): any;
/**
 * Reallow screen capture and recording. If you haven't called
 * `prevent()` yet, this method does nothing.
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
