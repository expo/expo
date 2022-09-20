import { Subscription } from 'expo-modules-core';
import { ClipboardImage, ContentType, GetImageOptions, GetStringOptions, SetStringOptions } from './Clipboard.types';
declare type ClipboardEvent = {
    /**
     * @deprecated Returns empty string. Use [`getStringAsync()`](#getstringasyncoptions) instead to retrieve clipboard content.
     */
    content: string;
    /**
     * An array of content types that are available on the clipboard.
     */
    contentTypes: ContentType[];
};
export { Subscription, ClipboardEvent };
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
 * @deprecated Use [`setStringAsync()`](#setstringasynctext-options) instead.
 *
 * @returns On web, this returns a boolean value indicating whether or not the string was saved to
 * the user's clipboard. On iOS and Android, nothing is returned.
 */
export declare function setString(text: string): void;
/**
 * Returns whether the clipboard has text content. Returns true for both plain text and rich text (e.g. HTML).
 *
 * On web, this requires the user to grant your app permission to _"see text and images copied to the clipboard"_.
 *
 * @returns A promise that fulfills to `true` if clipboard has text content, resolves to `false` otherwise.
 */
export declare function hasStringAsync(): Promise<boolean>;
/**
 * Gets the URL from the user's clipboard.
 *
 * @returns A promise that fulfills to the URL in the clipboard.
 * @platform ios
 */
export declare function getUrlAsync(): Promise<string | null>;
/**
 * Sets a URL in the user's clipboard.
 *
 * This function behaves the same as [`setStringAsync()`](#setstringasynctext-options), except that
 * it sets the clipboard content type to be a URL. It lets your app or other apps know that the
 * clipboard contains a URL and behave accordingly.
 *
 * @param url The URL to save to the clipboard.
 * @platform ios
 */
export declare function setUrlAsync(url: string): Promise<void>;
/**
 * Returns whether the clipboard has a URL content.
 *
 * @returns A promise that fulfills to `true` if clipboard has URL content, resolves to `false` otherwise.
 * @platform ios
 */
export declare function hasUrlAsync(): Promise<boolean>;
/**
 * Gets the image from the user's clipboard and returns it in the specified format. Please note that calling
 * this method on web will prompt the user to grant your app permission to "see text and images copied to the clipboard."
 *
 * @param options A `GetImageOptions` object to specify the desired format of the image.
 * @returns If there was an image in the clipboard, the promise resolves to
 * a [`ClipboardImage`](#clipboardimage) object containing the base64 string and metadata of the image.
 * Otherwise, it resolves to `null`.
 *
 * @example
 * ```tsx
 * const img = await Clipboard.getImageAsync({ format: 'png' });
 * // ...
 * <Image source={{ uri: img?.data }} style={{ width: 200, height: 200 }} />
 * ```
 */
export declare function getImageAsync(options: GetImageOptions): Promise<ClipboardImage | null>;
/**
 * Sets an image in the user's clipboard.
 *
 * @param base64Image Image encoded as a base64 string, without MIME type.
 *
 * @example
 * ```tsx
 * const result = await ImagePicker.launchImageLibraryAsync({
 *   mediaTypes: ImagePicker.MediaTypeOptions.Images,
 *   base64: true,
 * });
 * await Clipboard.setImageAsync(result.base64);
 * ```
 */
export declare function setImageAsync(base64Image: string): Promise<void>;
/**
 * Returns whether the clipboard has an image content.
 *
 * On web, this requires the user to grant your app permission to _"see text and images copied to the clipboard"_.
 *
 * @returns A promise that fulfills to `true` if clipboard has image content, resolves to `false` otherwise.
 */
export declare function hasImageAsync(): Promise<boolean>;
/**
 * Adds a listener that will fire whenever the content of the user's clipboard changes. This method
 * is a no-op on Web.
 *
 * @param listener Callback to execute when listener is triggered. The callback is provided a
 * single argument that is an object containing information about clipboard contents.
 *
 * @example
 * ```typescript
 * Clipboard.addClipboardListener(({ contentTypes }: ClipboardEvent) => {
 *   if (contentTypes.includes(Clipboard.ContentType.PLAIN_TEXT)) {
 *     Clipboard.getStringAsync().then(content => {
 *       alert('Copy pasta! Here\'s the string that was copied: ' + content)
 *     });
 *   } else if (contentTypes.includes(Clipboard.ContentType.IMAGE)) {
 *     alert('Yay! Clipboard contains an image');
 *   }
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
export * from './Clipboard.types';
//# sourceMappingURL=Clipboard.d.ts.map