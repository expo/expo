import ExpoAppleAuthenticationButton from './ExpoAppleAuthenticationButton';
// @needsAudit
/**
 * This component displays the proprietary "Sign In with Apple" / "Continue with Apple" button on
 * your screen. The App Store Guidelines require you to use this component to start the
 * authentication process instead of a custom button. Limited customization of the button is
 * available via the provided properties.
 *
 * You should only attempt to render this if [`AppleAuthentication.isAvailableAsync()`](#appleauthenticationisavailableasync)
 * resolves to `true`. This component will render nothing if it is not available, and you will get
 * a warning in development mode (`__DEV__ === true`).
 *
 * The properties of this component extend from `View`; however, you should not attempt to set
 * `backgroundColor` or `borderRadius` with the `style` property. This will not work and is against
 * the App Store Guidelines. Instead, you should use the `buttonStyle` property to choose one of the
 * predefined color styles and the `cornerRadius` property to change the border radius of the
 * button.
 *
 * Make sure to attach height and width via the style props as without these styles, the button will
 * not appear on the screen.
 *
 * @see [Apple
 * Documentation](https://developer.apple.com/documentation/authenticationservices/asauthorizationappleidbutton)
 * for more details.
 */
export default function AppleAuthenticationButton({ onPress, ...restProps }) {
    if (!ExpoAppleAuthenticationButton) {
        if (__DEV__) {
            console.warn("'AppleAuthenticationButton' is not available.");
        }
        return null;
    }
    return <ExpoAppleAuthenticationButton onButtonPress={onPress} {...restProps}/>;
}
//# sourceMappingURL=AppleAuthenticationButton.js.map