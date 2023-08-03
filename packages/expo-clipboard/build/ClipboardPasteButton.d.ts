import { ClipboardPasteButtonProps } from './Clipboard.types';
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
export declare function ClipboardPasteButton({ onPress, ...restProps }: ClipboardPasteButtonProps): JSX.Element | null;
//# sourceMappingURL=ClipboardPasteButton.d.ts.map