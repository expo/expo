import { isDevice } from 'expo-device';

import Environment from './utils/Environment';

export default {
  // Disable all project tools in the App Store client.
  ENABLE_PROJECT_TOOLS: !Environment.IsIOSRestrictedBuild,
  ENABLE_QR_CODE_BUTTON: isDevice && !Environment.IsIOSRestrictedBuild,
  // Disable the clipboard button in the App Store client.
  ENABLE_CLIPBOARD_BUTTON: !Environment.IsIOSRestrictedBuild,
};
