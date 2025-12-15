import { withGradleProperties } from '@expo/config-plugins';
import type { ExpoConfig } from '@expo/config-types';

import { GradlePropertiesConfig } from './withEdgeToEdge';

const OLD_EXPO_EDGE_TO_EDGE_ENABLED_GRADLE_PROPERTY_COMMENT =
  'Whether the app is configured to use edge-to-edge via the app config or `react-native-edge-to-edge` plugin';
const EXPO_EDGE_TO_EDGE_ENABLED_GRADLE_PROPERTY_KEY = 'expo.edgeToEdgeEnabled';
const EXPO_EDGE_TO_EDGE_ENABLED_GRADLE_PROPERTY_COMMENT =
  'Specifies whether the app is configured to use edge-to-edge via the app config or plugin\n' +
  '# WARNING: This property has been deprecated and will be removed in Expo SDK 55. Use `edgeToEdgeEnabled` or `react.edgeToEdgeEnabled` to determine whether the project is using edge-to-edge.';

const REACT_EDGE_TO_EDGE_ENABLED_GRADLE_PROPERTY_KEY = 'edgeToEdgeEnabled';
const REACT_EDGE_TO_EDGE_ENABLED_GRADLE_PROPERTY_COMMENT =
  'Use this property to enable edge-to-edge display support.\n' +
  '# This allows your app to draw behind system bars for an immersive UI.\n' +
  '# Note: Only works with ReactActivity and should not be used with custom Activity.';

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
  // TODO: Remove for SDK 55
  config = removeOldExpoEdgeToEdgeEnabledComment(config);

  // TODO: Remove for SDK 55
  config = configureGradleProperty(
    config,
    EXPO_EDGE_TO_EDGE_ENABLED_GRADLE_PROPERTY_KEY,
    edgeToEdgeEnabled ? 'true' : 'false',
    EXPO_EDGE_TO_EDGE_ENABLED_GRADLE_PROPERTY_COMMENT
  );

  return configureGradleProperty(
    config,
    REACT_EDGE_TO_EDGE_ENABLED_GRADLE_PROPERTY_KEY,
    edgeToEdgeEnabled ? 'true' : 'false',
    REACT_EDGE_TO_EDGE_ENABLED_GRADLE_PROPERTY_COMMENT
  );
}

// TODO: Remove for SDK 55
function removeOldExpoEdgeToEdgeEnabledComment(
  config: GradlePropertiesConfig
): GradlePropertiesConfig {
  const commentIndex = config.modResults.findIndex(
    (item) =>
      item.type === 'comment' &&
      item.value === OLD_EXPO_EDGE_TO_EDGE_ENABLED_GRADLE_PROPERTY_COMMENT
  );
  if (commentIndex !== -1) {
    config.modResults.splice(commentIndex, 1);
  }
  return config;
}

function configureGradleProperty(
  config: GradlePropertiesConfig,
  key: string,
  value: string,
  comment: string,
  addNewLine: boolean = true
): GradlePropertiesConfig {
  const propertyIndex = config.modResults.findIndex(
    (item) => item.type === 'property' && item.key === key
  );

  if (propertyIndex !== -1 && config.modResults[propertyIndex].type === 'property') {
    config.modResults[propertyIndex].value = value;
  } else {
    config.modResults.push({
      type: 'comment',
      value: comment,
    });

    config.modResults.push({
      type: 'property',
      key,
      value: addNewLine ? value + '\n' : value,
    });
  }

  return config;
}
