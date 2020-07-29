import Constants from 'expo-constants';
import { Platform } from 'react-native';

import Environment from './utils/Environment';

export default {
  HIDE_EXPLORE_TABS: Platform.OS === 'android',
  DISPLAY_EXPERIMENTAL_EXPLORE_TABS: false,
  INFINITE_SCROLL_EXPLORE_TABS: false,
  // Disable all project tools in the App Store client.
  ENABLE_PROJECT_TOOLS: !Environment.IsIOSRestrictedBuild,
  ENABLE_QR_CODE_BUTTON: Constants.isDevice && !Environment.IsIOSRestrictedBuild,
  // Disable the clipboard button in the App Store client.
  ENABLE_CLIPBOARD_BUTTON: !Environment.IsIOSRestrictedBuild,
};
