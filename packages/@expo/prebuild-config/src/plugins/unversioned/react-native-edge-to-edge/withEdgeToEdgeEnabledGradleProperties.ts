import { withGradleProperties } from '@expo/config-plugins';
import type { ExpoConfig } from '@expo/config-types';

import { GradlePropertiesConfig } from './withEdgeToEdge';

const EDGE_TO_EDGE_ENABLED_GRADLE_PROPERTY_KEY = 'expo.edgeToEdgeEnabled';
const EDGE_TO_EDGE_ENABLED_GRADLE_PROPERTY_COMMENT =
  'Whether the app is configured to use edge-to-edge via the application config or `react-native-edge-to-edge` plugin';

export function withEdgeToEdgeEnabledGradleProperties(
  config: ExpoConfig,
  props: {
    edgeToEdgeEnabled: boolean;
  }
) {
  return withGradleProperties(config, (config) => {
    return configureEdgeToEdgeEnabledGradleProperties(config, props.edgeToEdgeEnabled);
  });
}

export function configureEdgeToEdgeEnabledGradleProperties(
  config: GradlePropertiesConfig,
  edgeToEdgeEnabled: boolean
): GradlePropertiesConfig {
  const propertyIndex = config.modResults.findIndex(
    (item) => item.type === 'property' && item.key === EDGE_TO_EDGE_ENABLED_GRADLE_PROPERTY_KEY
  );
  if (propertyIndex !== -1) {
    config.modResults.splice(propertyIndex, 1);
  }
  const commentIndex = config.modResults.findIndex(
    (item) => item.type === 'comment' && item.value === EDGE_TO_EDGE_ENABLED_GRADLE_PROPERTY_COMMENT
  );
  if (commentIndex !== -1) {
    config.modResults.splice(commentIndex, 1);
  }

  config.modResults.push({
    type: 'comment',
    value: EDGE_TO_EDGE_ENABLED_GRADLE_PROPERTY_COMMENT,
  });
  config.modResults.push({
    type: 'property',
    key: EDGE_TO_EDGE_ENABLED_GRADLE_PROPERTY_KEY,
    value: edgeToEdgeEnabled ? 'true' : 'false',
  });

  return config;
}
