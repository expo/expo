import { ConfigPlugin, createRunOncePlugin } from '@expo/config-plugins';

import { withDocumentPickerIOS } from './withDocumentPickerIOS';

const pkg = require('expo-document-picker/package.json');

const withDocumentPicker: ConfigPlugin<{ appleTeamId?: string } | void> = (
  config,
  { appleTeamId = process.env.EXPO_APPLE_TEAM_ID } = {}
) => {
  config = withDocumentPickerIOS(config, { appleTeamId });
  return config;
};

export default createRunOncePlugin(withDocumentPicker, pkg.name, pkg.version);
