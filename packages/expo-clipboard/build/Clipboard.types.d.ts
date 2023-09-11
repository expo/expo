import { ViewProps, StyleProp, ViewStyle } from 'react-native';
export interface GetImageOptions {
    /**
     * The format of the clipboard image to be converted to.
     */
    format: 'png' | 'jpeg';
    /**
     * Specify the quality of the returned image, between `0` and `1`. Defaults to `1` (highest quality).
     * Applicable only when `format` is set to `jpeg`, ignored otherwise.
     * @default 1
     */
    jpegQuality?: number;
}
export interface ClipboardImage {
    /**
     * A Base64-encoded string of the image data.
     * Its format is dependent on the `format` option.
     *
     * > **NOTE:** The string is already prepended with `data:image/png;base64,` or `data:image/jpeg;base64,` prefix.
     *
     * You can use it directly as the source of an `Image` element.
     * @example
     * ```ts
     * <Image
     *   source={{ uri: clipboardImage.data }}
     *   style={{ width: 200, height: 200 }}
     * />
     * ```
     */
    data: string;
    /**
     * Dimensions (`width` and `height`) of the image pasted from clipboard.
     */
    size: {
        width: number;
        height: number;
    };
}
/**
 * Type used to define what type of data is stored in the clipboard.
 */
export declare enum ContentType {
    PLAIN_TEXT = "plain-text",
    HTML = "html",
    IMAGE = "image",
    /**
     * @platform iOS
     */
    URL = "url"
}
/**
 * Type used to determine string format stored in the clipboard.
 */
export declare enum StringFormat {
    PLAIN_TEXT = "plainText",
    HTML = "html"
}
export interface GetStringOptions {
    /**
     * The target format of the clipboard string to be converted to, if possible.
     *
     * @default StringFormat.PLAIN_TEXT
     */
    preferredFormat?: StringFormat;
}
export interface SetStringOptions {
    /**
     * The input format of the provided string.
     * Adjusting this option can help other applications interpret copied string properly.
     *
     * @default StringFormat.PLAIN_TEXT
     */
    inputFormat?: StringFormat;
}
export interface ClipboardPasteButtonProps extends ViewProps {
    /**
     * A callback that is called with the result of the paste action.
     * Inspect the `type` property to determine the type of the pasted data.
     
     * Can be one of `text` or `image`.
     *
     * @example
     * ```ts
     *   onPress={(data) => {
     *     if (data.type === 'image') {
     *       setImageData(data);
     *    } else {
     *       setTextData(data);
     *     }
     *   }}
     * ```
     */
    onPress: (data: PasteEventPayload) => void;
    /**
     * The backgroundColor of the button.
     * Leaving this as the default allows the color to adjust to the system theme settings.
     */
    backgroundColor?: string | null;
    /**
     * The foregroundColor of the button.
     * @default white
     */
    foregroundColor?: string | null;
    /**
     * The cornerStyle of the button.
     * @default capsule
     *
     * @see [Apple Documentation](https://developer.apple.com/documentation/uikit/uibutton/configuration/cornerstyle) for more details.
     */
    cornerStyle?: CornerStyle | null;
    /**
     * The displayMode of the button.
     * @default `iconAndLabel`
     *
     * @see [Apple Documentation](https://developer.apple.com/documentation/uikit/uipastecontrol/displaymode) for more details.
     */
    displayMode?: DisplayMode | null;
    /**
     * The custom style to apply to the button. Should not include `backgroundColor`, `borderRadius` or `color`
     * properties.
     */
    style?: StyleProp<Omit<ViewStyle, 'backgroundColor' | 'borderRadius' | 'color'>>;
    /**
     * The options to use when pasting an image from the clipboard.
     */
    imageOptions?: GetImageOptions | null;
    /**
     * An array of the content types that will cause the button to become active
     * @note do not include `plain-text` and `html` at the same time as this will cause all text to be treated as `html`
     * @default ['plain-text', 'image']
     */
    acceptedContentTypes?: AcceptedContentType[];
}
type AcceptedContentType = 'plain-text' | 'image' | 'url' | 'html';
type CornerStyle = 'dynamic' | 'fixed' | 'capsule' | 'large' | 'medium' | 'small';
type DisplayMode = 'iconAndLabel' | 'iconOnly' | 'labelOnly';
export type PasteEventPayload = TextPasteEvent | ImagePasteEvent;
export interface TextPasteEvent {
    text: string;
    type: 'text';
}
export interface ImagePasteEvent extends ClipboardImage {
    type: 'image';
}
export {};
//# sourceMappingURL=Clipboard.types.d.ts.map