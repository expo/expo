import {
  ConfigPlugin,
  createRunOncePlugin,
  PluginParameters,
  withPlugins,
  withStaticPlugin,
} from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';

const toCamelCase = (s: string) => s.replace(/-./g, x => x.toUpperCase()[1]);

function isModuleExcluded(config: Pick<ExpoConfig, '_internal'>, packageName: string): boolean {
  // Skip using the versioned plugin when autolinking is enabled
  // and doesn't link the native module.
  return (
    config._internal?.autolinkedModules && !config._internal.autolinkedModules.includes(packageName)
  );
}

export function createLegacyPlugin({
  packageName,
  fallback,
}: {
  packageName: string;
  fallback: ConfigPlugin | PluginParameters<typeof withPlugins>;
}): ConfigPlugin {
  let withFallback: ConfigPlugin;

  if (Array.isArray(fallback)) {
    withFallback = config => withPlugins(config, fallback);
  } else {
    withFallback = fallback;
  }

  const withUnknown: ConfigPlugin = config => {
    // Skip using the versioned plugin when autolinking is enabled
    // and doesn't link the native module.
    if (isModuleExcluded(config, packageName)) {
      return createRunOncePlugin(withFallback, packageName)(config);
    }

    return withStaticPlugin(config, {
      _isLegacyPlugin: true,
      plugin: packageName,
      // If the static plugin isn't found, use the unversioned one.
      fallback: createRunOncePlugin(withFallback, packageName),
    });
  };

  const methodName = toCamelCase(`with-${packageName}`);
  Object.defineProperty(withUnknown, 'name', {
    value: methodName,
  });

  return withUnknown;
}
