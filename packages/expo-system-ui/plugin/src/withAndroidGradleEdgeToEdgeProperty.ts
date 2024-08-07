import { ConfigPlugin, withGradleProperties } from 'expo/config-plugins';

export const withAndroidGradleEdgeToEdgeProperty: ConfigPlugin = (config) => {
  const comment = {
    type: 'comment',
    value: 'Enable edge-to-edge',
  } as const;

  return withGradleProperties(config, async (config) => {
    const { experiments = {} } = config;
    const { edgeToEdge = false } = experiments;

    const property = {
      type: 'property',
      key: 'edgeToEdgeEnabled',
      value: String(edgeToEdge),
    } as const;

    const currentIndex = config.modResults.findIndex(
      (item) => item.type === 'property' && item.key === property.key
    );

    if (currentIndex > -1) {
      config.modResults[currentIndex] = property;
    } else {
      config.modResults.push(comment, property);
    }

    return config;
  });
};
