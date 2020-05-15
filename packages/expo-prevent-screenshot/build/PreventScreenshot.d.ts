/**
 * Prevent screen capture and recording
 *
 * @example
 * ```typescript
 * await activatePreventScreenshot();
 * ```
 */
export declare function activatePreventScreenshot(): Promise<any>;
/**
 * Reallow screen capture and recording. If you haven't called
 * `prevent()` yet, this method does nothing.
 *
 * @example
 * ```typescript
 * await deactivatePreventScreenshot();
 * ```
 */
export declare function deactivatePreventScreenshot(): Promise<any>;
/**
 * React hook for preventing screen capturing while the
 * component is mounted.
 *
 * @example
 * ```typescript
 * usePreventScreenshot();
 * ```
 */
export declare function usePreventScreenshot(): void;
