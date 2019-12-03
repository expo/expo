import { requireNativeViewManager } from '@unimodules/core';
import { Platform } from 'react-native';

let ExpoAppleAuthenticationButtonSignInWhite: any;
let ExpoAppleAuthenticationButtonSignInWhiteOutline: any;
let ExpoAppleAuthenticationButtonSignInBlack: any;
let ExpoAppleAuthenticationButtonContinueWhite: any;
let ExpoAppleAuthenticationButtonContinueWhiteOutline: any;
let ExpoAppleAuthenticationButtonContinueBlack: any;

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
}

export {
  ExpoAppleAuthenticationButtonSignInWhite,
  ExpoAppleAuthenticationButtonSignInWhiteOutline,
  ExpoAppleAuthenticationButtonSignInBlack,
  ExpoAppleAuthenticationButtonContinueWhite,
  ExpoAppleAuthenticationButtonContinueWhiteOutline,
  ExpoAppleAuthenticationButtonContinueBlack,
};
