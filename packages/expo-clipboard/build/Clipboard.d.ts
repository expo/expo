import { Subscription } from '@unimodules/core';
/**
 * Gets the content of the user's clipboard. Please note that calling this method on web will prompt
 * the user to grant your app permission to "see text and images copied to the clipboard."
 *
 * @returns A promise that resolves to the content of the clipboard.
 */
export declare function getStringAsync(): Promise<string>;
/**
 * Sets the content of the user's clipboard.
 *
 * @param text The string to save to the clipboard.
 *
 * @returns On web, this returns a boolean value indicating whether or not the string was saved to
 * the user's clipboard. On iOS and Android, nothing is returned.
 */
export declare function setString(text: string): void;
/**
 * Adds a listener that will fire whenever the content of the user's clipboard changes.
 *
 * @param listener Callback to execute when listener is triggered.
 *
 * @example
 * ```typescript
 * addClipboardListener(() => {
 *   alert('Copy pasta!');
 * });
 * ```
 */
export declare function addClipboardListener(listener: (event: {
    content: string;
}) => void): Subscription;
/**
 * Removes the listener added by addClipboardListener
 *
 * @param subscription The subscription to remove (created by addClipboardListener).
 *
 * @example
 * ```typescript
 * const subscription = addClipboardListener(() => {
 *   alert('Copy pasta!');
 * });
 * removeClipboardListener(subscription);
 * ```
 */
export declare function removeClipboardListener(subscription: Subscription): void;
