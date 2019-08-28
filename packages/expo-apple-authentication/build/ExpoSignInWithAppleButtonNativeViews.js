import { requireNativeViewManager } from '@unimodules/core';
import { Platform } from 'react-native';
let ExpoSignInWithAppleButtonSignInWhite;
let ExpoSignInWithAppleButtonSignInWhiteOutline;
let ExpoSignInWithAppleButtonSignInBlack;
let ExpoSignInWithAppleButtonContinueWhite;
let ExpoSignInWithAppleButtonContinueWhiteOutline;
let ExpoSignInWithAppleButtonContinueBlack;
if (Platform.OS === 'ios') {
    ExpoSignInWithAppleButtonSignInWhite = requireNativeViewManager('ExpoSignInWithAppleButtonSignInWhite');
    ExpoSignInWithAppleButtonSignInWhiteOutline = requireNativeViewManager('ExpoSignInWithAppleButtonSignInWhiteOutline');
    ExpoSignInWithAppleButtonSignInBlack = requireNativeViewManager('ExpoSignInWithAppleButtonSignInBlack');
    ExpoSignInWithAppleButtonContinueWhite = requireNativeViewManager('ExpoSignInWithAppleButtonContinueWhite');
    ExpoSignInWithAppleButtonContinueWhiteOutline = requireNativeViewManager('ExpoSignInWithAppleButtonContinueWhiteOutline');
    ExpoSignInWithAppleButtonContinueBlack = requireNativeViewManager('ExpoSignInWithAppleButtonContinueBlack');
}
export { ExpoSignInWithAppleButtonSignInWhite, ExpoSignInWithAppleButtonSignInWhiteOutline, ExpoSignInWithAppleButtonSignInBlack, ExpoSignInWithAppleButtonContinueWhite, ExpoSignInWithAppleButtonContinueWhiteOutline, ExpoSignInWithAppleButtonContinueBlack, };
//# sourceMappingURL=ExpoSignInWithAppleButtonNativeViews.js.map