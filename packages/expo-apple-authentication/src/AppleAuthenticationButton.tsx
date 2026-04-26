import type { AppleAuthenticationButtonProps } from './AppleAuthentication.types';
import ExpoAppleAuthenticationButton from './ExpoAppleAuthenticationButton';

// @needsAudit
/**
 * This component displays Apple's proprietary "Sign In with Apple" / "Continue with Apple" button
 * using the native [`ASAuthorizationAppleIDButton`](https://developer.apple.com/documentation/authenticationservices/asauthorizationappleidbutton).
 * Apple's [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/sign-in-with-apple)
 * allow custom buttons as long as they follow Apple's branding rules (approved title, official
 * logo asset, approved colors, proportions, and minimum size). Using this component is the easiest
 * way to meet those requirements, since the system button is automatically Apple-approved,
 * localized, and accessible.
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
 * Make sure to attach height and width via the style props, since without them the button will
 * not appear on the screen.
 *
 * @see [Apple
 * Documentation](https://developer.apple.com/documentation/authenticationservices/asauthorizationappleidbutton)
 * for more details.
 */
export default function AppleAuthenticationButton({
  onPress,
  ...restProps
}: AppleAuthenticationButtonProps) {
  if (!ExpoAppleAuthenticationButton) {
    if (__DEV__) {
      console.warn("'AppleAuthenticationButton' is not available.");
    }
    return null;
  }
  return <ExpoAppleAuthenticationButton onButtonPress={onPress} {...restProps} />;
}
