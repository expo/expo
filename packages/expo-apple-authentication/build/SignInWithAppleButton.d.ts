import React from 'react';
import { ButtonProps } from './AppleAuthentication.types';
/**
 * This component displays the "Sign In with Apple" button on your screen.
 * The App Store Guidelines require you to use this component to start the sign in process instead of a custom button.
 * You can customise the design of the button using the properties.
 * You should start the sign in process when the `onPress` property is called.
 *
 * You should only attempt to render this if `SignInWithApple.isAvailableAsync()` resolves to true.
 * This component will render nothing if it is not available and you will get a warning in `__DEV__ === true`.
 *
 * The properties of this component extends from `View`, however, you should not attempt to restyle the background color
 * or border radius with the style property.
 * This will not work and is against the App Store Guidelines.
 *
 * The additionally accepted properites are described in `SignInWithAppleButtonProps`.
 *
 * @see [Apple Documention](https://developer.apple.com/documentation/authenticationservices/asauthorizationappleidbutton) for more details.
 *
 * @example
 * ```ts
 * import { SignInWithAppleButton, SignInWithAppleButtonType, SignInWithAppleButtonStyle } from 'expo-apple-authentication';
 *
 * function YourComponent() {
 *   return (
 *     <SignInWithAppleButton
 *       buttonType={SignInWithAppleButtonType.Default}
 *       buttonStyle={SignInWithAppleButtonStyle.Black}
 *       cornerRadus={5}
 *       onPress={() => {
 *         // Start the sign in process
 *       }}
 *     />
 *   );
 * }
 * ```
 */
declare const ExpoSignInWithAppleButton: React.FunctionComponent<ButtonProps>;
export default ExpoSignInWithAppleButton;
