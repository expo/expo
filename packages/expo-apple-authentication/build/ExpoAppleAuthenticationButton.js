import { requireNativeViewManager } from 'expo-modules-core';
import { Platform } from 'react-native';
let ExpoAppleAuthenticationButtonSignInWhite;
let ExpoAppleAuthenticationButtonSignInWhiteOutline;
let ExpoAppleAuthenticationButtonSignInBlack;
let ExpoAppleAuthenticationButtonContinueWhite;
let ExpoAppleAuthenticationButtonContinueWhiteOutline;
let ExpoAppleAuthenticationButtonContinueBlack;
let ExpoAppleAuthenticationButtonSignUpWhite;
let ExpoAppleAuthenticationButtonSignUpWhiteOutline;
let ExpoAppleAuthenticationButtonSignUpBlack;
if (Platform.OS === 'ios') {
    ExpoAppleAuthenticationButtonSignInWhite = requireNativeViewManager('ExpoAppleAuthenticationButtonSignInWhite');
    ExpoAppleAuthenticationButtonSignInWhiteOutline = requireNativeViewManager('ExpoAppleAuthenticationButtonSignInWhiteOutline');
    ExpoAppleAuthenticationButtonSignInBlack = requireNativeViewManager('ExpoAppleAuthenticationButtonSignInBlack');
    ExpoAppleAuthenticationButtonContinueWhite = requireNativeViewManager('ExpoAppleAuthenticationButtonContinueWhite');
    ExpoAppleAuthenticationButtonContinueWhiteOutline = requireNativeViewManager('ExpoAppleAuthenticationButtonContinueWhiteOutline');
    ExpoAppleAuthenticationButtonContinueBlack = requireNativeViewManager('ExpoAppleAuthenticationButtonContinueBlack');
    ExpoAppleAuthenticationButtonSignUpWhite = requireNativeViewManager('ExpoAppleAuthenticationButtonSignUpWhite');
    ExpoAppleAuthenticationButtonSignUpWhiteOutline = requireNativeViewManager('ExpoAppleAuthenticationButtonSignUpWhiteOutline');
    ExpoAppleAuthenticationButtonSignUpBlack = requireNativeViewManager('ExpoAppleAuthenticationButtonSignUpBlack');
}
export { ExpoAppleAuthenticationButtonSignInWhite, ExpoAppleAuthenticationButtonSignInWhiteOutline, ExpoAppleAuthenticationButtonSignInBlack, ExpoAppleAuthenticationButtonContinueWhite, ExpoAppleAuthenticationButtonContinueWhiteOutline, ExpoAppleAuthenticationButtonContinueBlack, ExpoAppleAuthenticationButtonSignUpWhite, ExpoAppleAuthenticationButtonSignUpWhiteOutline, ExpoAppleAuthenticationButtonSignUpBlack, };
//# sourceMappingURL=ExpoAppleAuthenticationButton.js.map