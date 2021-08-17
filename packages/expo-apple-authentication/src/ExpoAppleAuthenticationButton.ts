import { requireNativeViewManager } from 'expo-modules-core';
import { Platform } from 'react-native';

let ExpoAppleAuthenticationButtonSignInWhite: any;
let ExpoAppleAuthenticationButtonSignInWhiteOutline: any;
let ExpoAppleAuthenticationButtonSignInBlack: any;
let ExpoAppleAuthenticationButtonContinueWhite: any;
let ExpoAppleAuthenticationButtonContinueWhiteOutline: any;
let ExpoAppleAuthenticationButtonContinueBlack: any;
let ExpoAppleAuthenticationButtonSignUpWhite: any;
let ExpoAppleAuthenticationButtonSignUpWhiteOutline: any;
let ExpoAppleAuthenticationButtonSignUpBlack: any;

if (Platform.OS === 'ios') {
  ExpoAppleAuthenticationButtonSignInWhite = requireNativeViewManager(
    'ExpoAppleAuthenticationButtonSignInWhite'
  );
  ExpoAppleAuthenticationButtonSignInWhiteOutline = requireNativeViewManager(
    'ExpoAppleAuthenticationButtonSignInWhiteOutline'
  );
  ExpoAppleAuthenticationButtonSignInBlack = requireNativeViewManager(
    'ExpoAppleAuthenticationButtonSignInBlack'
  );
  ExpoAppleAuthenticationButtonContinueWhite = requireNativeViewManager(
    'ExpoAppleAuthenticationButtonContinueWhite'
  );
  ExpoAppleAuthenticationButtonContinueWhiteOutline = requireNativeViewManager(
    'ExpoAppleAuthenticationButtonContinueWhiteOutline'
  );
  ExpoAppleAuthenticationButtonContinueBlack = requireNativeViewManager(
    'ExpoAppleAuthenticationButtonContinueBlack'
  );
  ExpoAppleAuthenticationButtonSignUpWhite = requireNativeViewManager(
    'ExpoAppleAuthenticationButtonSignUpWhite'
  );
  ExpoAppleAuthenticationButtonSignUpWhiteOutline = requireNativeViewManager(
    'ExpoAppleAuthenticationButtonSignUpWhiteOutline'
  );
  ExpoAppleAuthenticationButtonSignUpBlack = requireNativeViewManager(
    'ExpoAppleAuthenticationButtonSignUpBlack'
  );
}

export {
  ExpoAppleAuthenticationButtonSignInWhite,
  ExpoAppleAuthenticationButtonSignInWhiteOutline,
  ExpoAppleAuthenticationButtonSignInBlack,
  ExpoAppleAuthenticationButtonContinueWhite,
  ExpoAppleAuthenticationButtonContinueWhiteOutline,
  ExpoAppleAuthenticationButtonContinueBlack,
  ExpoAppleAuthenticationButtonSignUpWhite,
  ExpoAppleAuthenticationButtonSignUpWhiteOutline,
  ExpoAppleAuthenticationButtonSignUpBlack,
};
