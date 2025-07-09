const formatToList = (items: string[]) => items.map((key) => `- ${key}`).join('\n');

export default function validatePathConfig(config: any, root = true) {
  const validKeys = ['initialRouteName', 'screens', '_route'];

  if (!root) {
    validKeys.push('path', 'exact', 'stringify', 'parse');
  }

  const invalidKeys = Object.keys(config).filter((key) => !validKeys.includes(key));

  if (invalidKeys.length) {
    throw new Error(
      `Found invalid properties in the configuration:\n${formatToList(
        invalidKeys
      )}\n\nDid you forget to specify them under a 'screens' property?\n\nYou can only specify the following properties:\n${formatToList(
        validKeys
      )}\n\nSee https://reactnavigation.org/docs/configuring-links for more details on how to specify a linking configuration.`
    );
  }

  if (config.screens) {
    Object.entries(config.screens).forEach(([_, value]) => {
      if (typeof value !== 'string') {
        validatePathConfig(value, false);
      }
    });
  }
}
