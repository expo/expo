import { EventEmitter, Subscription } from 'expo-modules-core';
import { ClipboardImage, GetImageOptions, GetStringOptions, SetStringOptions } from './Clipboard.types';
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
 * @param options Options for the clipboard content to be retrieved.
 * @returns A promise that resolves to the content of the clipboard.
 */
export declare function getStringAsync(options?: GetStringOptions): Promise<string>;
/**
 * Sets the content of the user's clipboard.
 *
 * @param text The string to save to the clipboard.
 * @param options Options for the clipboard content to be set.
 * @returns On web, this returns a promise that fulfills to a boolean value indicating whether or not
 * the string was saved to the user's clipboard. On iOS and Android, the promise always resolves to `true`.
 */
export declare function setStringAsync(text: string, options?: SetStringOptions): Promise<boolean>;
/**
 * Sets the content of the user's clipboard.
 * @deprecated Deprecated. Use [`setStringAsync()`](#setstringasynctext) instead.
 *
 * @returns On web, this returns a boolean value indicating whether or not the string was saved to
 * the user's clipboard. On iOS and Android, nothing is returned.
 */
export declare function setString(text: string): void;
/**
 * Returns whether the clipboard has text content.
 *
 * On web, this requires the user to grant your app permission to _"see text and images copied to the clipboard"_.
 *
 * @returns A promise that fulfills to `true` if clipboard has plain text content, resolves to `false` otherwise.
 */
export declare function hasStringAsync(): Promise<boolean>;
/**
 * Gets the url from the user's clipboard.
 *
 * @returns A promise that fulfills to the url in the clipboard.
 * @platform iOS
 */
export declare function getUrlAsync(): Promise<string | null>;
/**
 * Sets a url in the user's clipboard.
 *
 * @param url The url to save to the clipboard.
 * @platform iOS
 */
export declare function setUrlAsync(url: string): Promise<void>;
/**
 * Returns whether the clipboard has a URL content.
 *
 * @returns A promise that fulfills to `true` if clipboard has URL content, resolves to `false` otherwise.
 * @platform iOS
 */
export declare function hasUrlAsync(): Promise<boolean>;
/**
 * Gets the image from the user's clipboard and returns it in the specified format.
 *
 * @param options A `GetImageOptions` object to specify the desired format of the image.
 * @returns If there was an image in the clipboard, the promise resolves to
 * a [`ClipboardImage`](#clipboardimage) object containing the base64 string and metadata of the image.
 * Otherwise, it resolves to `null`.
 * @platform Android
 * @platform iOS
 */
export declare function getImageAsync(options: GetImageOptions): Promise<ClipboardImage | null>;
/**
 * Sets an image in the user's clipboard.
 *
 * @param base64Image Image encoded as a base64 string, without mime type.
 * @platform Android
 * @platform iOS
 */
export declare function setImageAsync(base64Image: string): Promise<void>;
/**
 * Returns whether the clipboard has a image content.
 *
 * @returns A promise that fulfills to `true` if clipboard has image content, resolves to `false` otherwise.
 * @platform Android
 * @platform iOS
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