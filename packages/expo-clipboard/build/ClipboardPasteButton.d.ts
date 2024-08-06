import React from 'react';
import { StyleProp, ViewProps, ViewStyle } from 'react-native';
import { AcceptedContentType, CornerStyleType, DisplayModeType, GetImageOptions, PasteEventPayload } from './Clipboard.types';
export type ClipboardPasteButtonProps = {
    /**
     * A callback that is called with the result of the paste action.
     * Inspect the `type` property to determine the type of the pasted data.
     *
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
     * @default 'white'
     */
    foregroundColor?: string | null;
    /**
     * The cornerStyle of the button.
     * @default 'capsule'
     *
     * @see [Apple Documentation](https://developer.apple.com/documentation/uikit/uibutton/configuration/cornerstyle) for more details.
     */
    cornerStyle?: CornerStyleType | null;
    /**
     * The displayMode of the button.
     * @default 'iconAndLabel'
     *
     * @see [Apple Documentation](https://developer.apple.com/documentation/uikit/uipastecontrol/displaymode) for more details.
     */
    displayMode?: DisplayModeType | null;
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
     * An array of the content types that will cause the button to become active.
     * > Do not include `plain-text` and `html` at the same time as this will cause all text to be treated as `html`.
     * @default ['plain-text', 'image']
     */
    acceptedContentTypes?: AcceptedContentType[];
} & ViewProps;
/**
 * This component displays the `UIPasteControl` button on your screen. This allows pasting from the clipboard without requesting permission from the user.
 *
 * You should only attempt to render this if [`Clipboard.isPasteButtonAvailable`](#ispastebuttonavailable)
 * is `true`. This component will render nothing if it is not available, and you will get
 * a warning in development mode (`__DEV__ === true`).
 *
 * The properties of this component extend from `View`; however, you should not attempt to set
 * `backgroundColor`, `color` or `borderRadius` with the `style` property. Apple restricts customisation of this view.
 * Instead, you should use the backgroundColor and foregroundColor properties to set the colors of the button, the cornerStyle property to change the border radius,
 * and the displayMode property to change the appearance of the icon and label. The word "Paste" is not editable and neither is the icon.
 *
 * Make sure to attach height and width via the style props as without these styles, the button will
 * not appear on the screen.
 *
 * @see [Apple Documentation](https://developer.apple.com/documentation/uikit/uipastecontrol) for more details.
 */
export declare function ClipboardPasteButton({ onPress, ...restProps }: ClipboardPasteButtonProps): React.JSX.Element | null;
//# sourceMappingURL=ClipboardPasteButton.d.ts.map