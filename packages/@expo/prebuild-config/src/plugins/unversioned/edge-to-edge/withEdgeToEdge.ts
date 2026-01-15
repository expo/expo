import {
  ConfigPlugin,
  ExportedConfigWithProps,
  WarningAggregator,
  AndroidConfig,
} from '@expo/config-plugins';
import { type ExpoConfig } from '@expo/config-types';

import { withConfigureEdgeToEdgeEnforcement } from './withConfigureEdgeToEdgeEnforcement';
import { withEdgeToEdgeEnabledGradleProperties } from './withEdgeToEdgeEnabledGradleProperties';
import { withEnforceNavigationBarContrast } from './withEnforceNavigationBarContrast';
import { withRestoreDefaultTheme } from './withRestoreDefaultTheme';

const TAG = 'EDGE_TO_EDGE_PLUGIN';

export type ResourceXMLConfig = ExportedConfigWithProps<AndroidConfig.Resources.ResourceXML>;
export type GradlePropertiesConfig = ExportedConfigWithProps<
  AndroidConfig.Properties.PropertiesItem[]
>;

export const withEdgeToEdge: ConfigPlugin = (config) => {
  return applyEdgeToEdge(config);
};

export function applyEdgeToEdge(config: ExpoConfig): ExpoConfig {
  config = withEdgeToEdgeEnabledGradleProperties(config, { edgeToEdgeEnabled: true });
  // Enable/disable edge-to-edge enforcement
  config = withConfigureEdgeToEdgeEnforcement(config, {
    disableEdgeToEdgeEnforcement: false,
  });

  config = withEnforceNavigationBarContrast(
    config,
    config.androidNavigationBar?.enforceContrast !== false
  );

  // We always restore the default theme in case the project has a leftover react-native-edge-to-edge theme from SDK 53.
  // If they are using react-native-edge-to-edge config plugin it'll be reapplied later.
  return withRestoreDefaultTheme(config);
}

export default withEdgeToEdge;
