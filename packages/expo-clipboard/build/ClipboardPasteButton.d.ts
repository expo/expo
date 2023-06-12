import { ApplePasteButtonProps } from './Clipboard.types';
/**
 * This component displays the `UIPasteControl` button on your screen. This allows pasting from the clipboard without requesting permission from the user.
 *
 * You should only attempt to render this if [`Clipboard.pasteButtonIsAvailable()`](#pasteButtonIsAvailable)
 * returns `true`. This component will render nothing if it is not available, and you will get
 * a warning in development mode (`__DEV__ === true`).
 *
 * The properties of this component extend from `View`; however, you should not attempt to set
 * `backgroundColor`, 'color' or `borderRadius` with the `style` property. Use the relevant props instead.
 *
 * Make sure to attach height and width via the style props as without these styles, the button will
 * not appear on the screen.
 *
 * @see [Apple
 * Documentation](https://developer.apple.com/documentation/uikit/uipastecontrol)
 * for more details.
 */
export default function ClipboardPasteButton({ onPress, ...restProps }: ApplePasteButtonProps): JSX.Element | null;
//# sourceMappingURL=ClipboardPasteButton.d.ts.map