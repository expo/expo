import { EventEmitter, Subscription } from 'expo-modules-core';
declare type ClipboardEvent = {
    /**
     * The new content of the user's clipboard.
     */
    content: string;
};
export { Subscription, EventEmitter, ClipboardEvent };
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
 * @returns On web, this returns a promise that fulfills to a boolean value indicating whether or not
 * the string was saved to the user's clipboard. On iOS and Android, the promise always resolves to `true`.
 */
export declare function setStringAsync(text: string): Promise<boolean>;
/**
 * Sets the content of the user's clipboard.
 * @deprecated Deprecated. Use [`setStringAsync()`](#setstringasynctext) instead.
 *
 * @returns On web, this returns a boolean value indicating whether or not the string was saved to
 * the user's clipboard. On iOS and Android, nothing is returned.
 */
export declare function setString(text: string): void;
/**
 * (iOS only) Gets the url from the user's clipboard.
 *
 * @returns A promise that resolves to the url in the clipboard.
 */
export declare function getUrlAsync(): Promise<string | null>;
/**
 * (iOS only) Sets a url in the user's clipboard.
 *
 * @param url The url to save to the clipboard.
 * @returns
 */
export declare function setUrlAsync(url: string): Promise<void>;
/**
 * (iOS only) Returns whether the clipboard has a URL content.
 *
 * @returns A promise that resolves to `true` if clipboard has URL content, resolves to `false` otherwise.
 */
export declare function hasUrlAsync(): Promise<boolean>;
/**
 * (iOS only) Gets the image from the user's clipboard in the png format.
 *
 * @returns A promise that resolves to base64 png image from the clipboard. You can use it
 * for example as the Image component source.
 */
export declare function getPngImageAsync(): Promise<string | null>;
/**
 * (iOS only) Gets the image from the user's clipboard in the jpg format.
 *
 * @returns A promise that resolves to base64 jpg image from the clipboard. You can use it
 * for example as the `Image` component source.
 */
export declare function getJpgImageAsync(): Promise<string | null>;
/**
 * (iOS only) Sets an image in the user's clipboard.
 *
 * @param base64Image Image encoded as a base64 string, without mime type.
 * @returns
 */
export declare function setImageAsync(base64Image: string): Promise<void>;
/**
 * (iOS only) Returns whether the clipboard has a image content.
 *
 * @returns A promise that resolves to `true` if clipboard has image content, resolves to `false` otherwise.
 */
export declare function hasImageAsync(): Promise<boolean>;
/**
 * Adds a listener that will fire whenever the content of the user's clipboard changes. This method
 * is a no-op on Web.
 *
 * @param listener Callback to execute when listener is triggered. The callback is provided a
 * single argument that is an object with a `content` key.
 *
 * @example
 * ```typescript
 * addClipboardListener(({ content }: ClipboardEvent) => {
 *   alert('Copy pasta! Here's the string that was copied: ' + content);
 * });
 * ```
 */
export declare function addClipboardListener(listener: (event: ClipboardEvent) => void): Subscription;
/**
 * Removes the listener added by addClipboardListener. This method is a no-op on Web.
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
//# sourceMappingURL=Clipboard.d.ts.map