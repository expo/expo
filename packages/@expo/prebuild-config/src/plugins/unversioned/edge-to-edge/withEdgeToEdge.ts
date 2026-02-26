import {
  ConfigPlugin,
  ExportedConfigWithProps,
  WarningAggregator,
  AndroidConfig,
} from '@expo/config-plugins';
import { type ExpoConfig } from '@expo/config-types';

import { withRestoreDefaultTheme } from './withRestoreDefaultTheme';

const TAG = 'EDGE_TO_EDGE_PLUGIN';

export type ResourceXMLConfig = ExportedConfigWithProps<AndroidConfig.Resources.ResourceXML>;

export const withEdgeToEdge: ConfigPlugin = (config) => {
  return applyEdgeToEdge(config);
};

export function applyEdgeToEdge(config: ExpoConfig): ExpoConfig {
  if ('edgeToEdgeEnabled' in (config.android ?? {})) {
    WarningAggregator.addWarningAndroid(
      TAG,
      '`edgeToEdgeEnabled` customization is no longer available - Android 16 makes edge-to-edge mandatory. Remove the `edgeToEdgeEnabled` entry from your app.json/app.config.js.'
    );
  }

  // We always restore the default theme in case the project has a leftover react-native-edge-to-edge theme from SDK 53.
  // If they are using react-native-edge-to-edge config plugin it'll be reapplied later.
  return withRestoreDefaultTheme(config);
}

export default withEdgeToEdge;
