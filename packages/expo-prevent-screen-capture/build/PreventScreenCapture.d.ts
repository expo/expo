/**
 * Prevent screen capture and recording
 *
 * @example
 * ```typescript
 * await activatePreventScreenCapture();
 * ```
 */
export declare function activatePreventScreenCapture(): Promise<any>;
/**
 * Reallow screen capture and recording. If you haven't called
 * `prevent()` yet, this method does nothing.
 *
 * @example
 * ```typescript
 * await deactivatePreventScreenCapture();
 * ```
 */
export declare function deactivatePreventScreenCapture(): Promise<any>;
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
