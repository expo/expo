import { isDevice } from 'expo-device';
import { Platform } from 'react-native';

import Environment from './utils/Environment';

export default {
  // Disable all project tools in the App Store client.
  ENABLE_PROJECT_TOOLS: !Environment.IsIOSRestrictedBuild,
  ENABLE_QR_CODE_BUTTON: isDevice && !Environment.IsIOSRestrictedBuild,
  // Disable the clipboard button in the App Store client.
  ENABLE_CLIPBOARD_BUTTON: !Environment.IsIOSRestrictedBuild,
  // Show the in-app email/password form instead of the web auth flow on iOS devices.
  // Simulator stays on the web flow (matches SDK 55 native client behavior).
  ENABLE_NATIVE_LOGIN_FORM: Platform.OS === 'ios' && isDevice,
};
