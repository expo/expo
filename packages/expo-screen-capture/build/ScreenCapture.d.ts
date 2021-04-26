import { Subscription } from '@unimodules/core';
/**
 * Returns whether the Screen Capture API is available on the current device.
 *
 * @returns Async `boolean`, indicating whether the Screen Capture API is available on the current device. Currently this resolves `true` on iOS and Android only.
 */
export declare function isAvailableAsync(): Promise<boolean>;
/**
 * Prevents screenshots and screen recordings. If you are
 * already preventing screen capture, this method does nothing.
 *
 * On iOS, this will only prevent screen recordings, and is only
 * available on iOS 11 and newer. On older iOS versions, this method
 * does nothing.
 *
 * @param key Optional. This will prevent multiple instances of the
 * preventScreenCaptureAsync and allowScreenCaptureAsync methods
 * from conflicting with each other. If provided, you will need to call
 * allowScreenCaptureAsync with the same key in order to re-enable
 * screen capturing. Defaults to 'default'.
 *
 * @example
 * ```typescript
 * preventScreenCaptureAsync();
 * ```
 */
export declare function preventScreenCaptureAsync(key?: string): Promise<void>;
/**
 * Reallows screenshots and recordings. If you haven't called
 * `preventScreenCapture()` yet, this method does nothing.
 *
 * @param key Optional. This will prevent multiple instances of the
 * preventScreenCaptureAsync and allowScreenCaptureAsync methods
 * from conflicting with each other. If provided, must be the same as the key
 * passed to preventScreenCaptureAsync in order to re-enable
 * screen capturing. Defaults to 'default'.
 *
 * @example
 * ```typescript
 * allowScreenCaptureAsync();
 * ```
 */
export declare function allowScreenCaptureAsync(key?: string): Promise<void>;
/**
 * React hook for preventing screenshots and screen recordings
 * while the component is mounted.
 *
 * @param key Optional. If provided, this will prevent multiple instances of
 * this hook or the preventScreenCaptureAsync and allowScreenCaptureAsync
 * methods from conflicting with each other. Defaults to 'default'.
 *
 * @example
 * ```typescript
 * usePreventScreenCapture();
 * ```
 */
export declare function usePreventScreenCapture(key?: string): void;
/**
 * Adds a listener that will fire whenever the user takes a screenshot.
 *
 * @param listener Callback executed when a screenshot occurs.
 *
 * @example
 * ```typescript
 * addScreenshotListener(() => {
 *   alert('Screenshots are fun!');
 * });
 * ```
 */
export declare function addScreenshotListener(listener: () => void): Subscription;
/**
 * Removes the listener added by addScreenshotListener
 *
 * @param subscription The subscription to remove (created by addScreenshotListener).
 *
 * @example
 * ```typescript
 * const subscription = addScreenshotListener(() => {
 *   alert('Screenshots are fun!');
 * });
 * removeScreenshotListener(subscription);
 * ```
 */
export declare function removeScreenshotListener(subscription: Subscription): void;
