import Constants from 'expo-constants';

import Environment from './utils/Environment';

export default {
  // Disable all project tools in the App Store client.
  ENABLE_PROJECT_TOOLS: !Environment.IsIOSRestrictedBuild,
  ENABLE_QR_CODE_BUTTON: Constants.isDevice && !Environment.IsIOSRestrictedBuild,
  // Disable the clipboard button in the App Store client.
  ENABLE_CLIPBOARD_BUTTON: !Environment.IsIOSRestrictedBuild,

  // Flags for the 2022 Expo Go redesign
  ENABLE_2022_NAVIGATION_REDESIGN: __DEV__,
  ENABLE_2022_DIAGNOSTICS_REDESIGN: __DEV__,
};
