import { ConfigPlugin, createRunOncePlugin } from '@expo/config-plugins';

import { withDocumentPickerIOS, IosProps } from './withDocumentPickerIOS';

const pkg = require('expo-document-picker/package.json');

const withDocumentPicker: ConfigPlugin<IosProps | void> = (
  config,
  { appleTeamId = process.env.EXPO_APPLE_TEAM_ID, iCloudContainerEnvironment } = {}
) => {
  config = withDocumentPickerIOS(config, { appleTeamId, iCloudContainerEnvironment });
  return config;
};

export default createRunOncePlugin(withDocumentPicker, pkg.name, pkg.version);
