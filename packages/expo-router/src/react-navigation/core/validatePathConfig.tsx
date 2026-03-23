const formatToList = (items: Record<string, string>) =>
  Object.entries(items)
    .map(([key, value]) => `- ${key} (${value})`)
    .join('\n');

export function validatePathConfig(config: unknown, root = true) {
  const validation = {
    path: 'string',
    initialRouteName: 'string',
    screens: 'object',
    ...(root
      ? null
      : {
          alias: 'array',
          exact: 'boolean',
          stringify: 'object',
          parse: 'object',
        }),
  };

  if (typeof config !== 'object' || config === null) {
    throw new Error(
      `Expected the configuration to be an object, but got ${JSON.stringify(
        config
      )}.`
    );
  }

  const validationErrors = Object.fromEntries(
    Object.keys(config)
      .map((key) => {
        if (key in validation) {
          const type = validation[key as keyof typeof validation];
          // @ts-expect-error: we know the key exists
          const value = config[key];

          if (value !== undefined) {
            if (type === 'array') {
              if (!Array.isArray(value)) {
                return [key, `expected 'Array', got '${typeof value}'`];
              }
            } else if (typeof value !== type) {
              return [key, `expected '${type}', got '${typeof value}'`];
            }
          }
        } else {
          return [key, 'extraneous'];
        }

        return null;
      })
      .filter(Boolean) as [string, string][]
  );

  if (Object.keys(validationErrors).length) {
    throw new Error(
      `Found invalid properties in the configuration:\n${formatToList(
        validationErrors
      )}\n\nYou can only specify the following properties:\n${formatToList(
        validation
      )}\n\nIf you want to specify configuration for screens, you need to specify them under a 'screens' property.\n\nSee https://reactnavigation.org/docs/configuring-links for more details on how to specify a linking configuration.`
    );
  }

  if (
    root &&
    'path' in config &&
    typeof config.path === 'string' &&
    config.path.includes(':')
  ) {
    throw new Error(
      `Found invalid path '${config.path}'. The 'path' in the top-level configuration cannot contain patterns for params.`
    );
  }

  if ('screens' in config && config.screens) {
    Object.entries(config.screens).forEach(([_, value]) => {
      if (typeof value !== 'string') {
        validatePathConfig(value, false);
      }
    });
  }
}
