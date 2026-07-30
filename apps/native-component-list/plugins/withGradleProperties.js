const { withGradleProperties } = require('expo/config-plugins');

/**
 * Apply the `{ [key]: value }` object to the Gradle properties.
 * This will replace the value of existing properties, or append the property definition at the end.
 * @type {import('expo/config-plugins').ConfigPlugin<Record<string, string>>}
 */
module.exports = (config, options = {}) => {
  return withGradleProperties(config, (config) => {
    for (const [key, value] of Object.entries(options)) {
      const idx = config.modResults.findIndex((node) => {
        return node.type === 'property' && node.key === key;
      });

      if (idx < 0) {
        config.modResults.push({ type: 'property', key, value });
      } else {
        config.modResults[idx].value = value;
      }
    }

    return config;
  });
};
