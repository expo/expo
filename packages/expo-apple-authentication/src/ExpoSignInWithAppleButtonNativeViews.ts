import { requireNativeViewManager } from '@unimodules/core';
import { Platform } from 'react-native';

let ExpoSignInWithAppleButtonSignInWhite: any;
let ExpoSignInWithAppleButtonSignInWhiteOutline: any;
let ExpoSignInWithAppleButtonSignInBlack: any;
let ExpoSignInWithAppleButtonContinueWhite: any;
let ExpoSignInWithAppleButtonContinueWhiteOutline: any;
let ExpoSignInWithAppleButtonContinueBlack: any;

if (Platform.OS === 'ios') {
  ExpoSignInWithAppleButtonSignInWhite = requireNativeViewManager('ExpoSignInWithAppleButtonSignInWhite');
  ExpoSignInWithAppleButtonSignInWhiteOutline = requireNativeViewManager('ExpoSignInWithAppleButtonSignInWhiteOutline');
  ExpoSignInWithAppleButtonSignInBlack = requireNativeViewManager('ExpoSignInWithAppleButtonSignInBlack');
  ExpoSignInWithAppleButtonContinueWhite = requireNativeViewManager('ExpoSignInWithAppleButtonContinueWhite');
  ExpoSignInWithAppleButtonContinueWhiteOutline = requireNativeViewManager('ExpoSignInWithAppleButtonContinueWhiteOutline');
  ExpoSignInWithAppleButtonContinueBlack = requireNativeViewManager('ExpoSignInWithAppleButtonContinueBlack');
}

export {
  ExpoSignInWithAppleButtonSignInWhite,
  ExpoSignInWithAppleButtonSignInWhiteOutline,
  ExpoSignInWithAppleButtonSignInBlack,
  ExpoSignInWithAppleButtonContinueWhite,
  ExpoSignInWithAppleButtonContinueWhiteOutline,
  ExpoSignInWithAppleButtonContinueBlack,
 }
