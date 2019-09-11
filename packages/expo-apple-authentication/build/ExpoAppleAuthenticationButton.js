import { requireNativeViewManager } from '@unimodules/core';
import { Platform } from 'react-native';
let ExpoAppleAuthenticationButtonSignInWhite;
let ExpoAppleAuthenticationButtonSignInWhiteOutline;
let ExpoAppleAuthenticationButtonSignInBlack;
let ExpoAppleAuthenticationButtonContinueWhite;
let ExpoAppleAuthenticationButtonContinueWhiteOutline;
let ExpoAppleAuthenticationButtonContinueBlack;
if (Platform.OS === 'ios') {
    ExpoAppleAuthenticationButtonSignInWhite = requireNativeViewManager('ExpoAppleAuthenticationButtonSignInWhite');
    ExpoAppleAuthenticationButtonSignInWhiteOutline = requireNativeViewManager('ExpoAppleAuthenticationButtonSignInWhiteOutline');
    ExpoAppleAuthenticationButtonSignInBlack = requireNativeViewManager('ExpoAppleAuthenticationButtonSignInBlack');
    ExpoAppleAuthenticationButtonContinueWhite = requireNativeViewManager('ExpoAppleAuthenticationButtonContinueWhite');
    ExpoAppleAuthenticationButtonContinueWhiteOutline = requireNativeViewManager('ExpoAppleAuthenticationButtonContinueWhiteOutline');
    ExpoAppleAuthenticationButtonContinueBlack = requireNativeViewManager('ExpoAppleAuthenticationButtonContinueBlack');
}
export { ExpoAppleAuthenticationButtonSignInWhite, ExpoAppleAuthenticationButtonSignInWhiteOutline, ExpoAppleAuthenticationButtonSignInBlack, ExpoAppleAuthenticationButtonContinueWhite, ExpoAppleAuthenticationButtonContinueWhiteOutline, ExpoAppleAuthenticationButtonContinueBlack, };
//# sourceMappingURL=ExpoAppleAuthenticationButton.js.map