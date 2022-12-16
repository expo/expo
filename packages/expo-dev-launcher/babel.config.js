function tryResolveModule(module) {
  try {
    return require.resolve(module);
  } catch (e) {
    console.error(`Couldn't resolve vendored module - ${module}.`);
    return null;
  }
}

module.exports = function (api) {
  api.cache(true);

  if (process.env.NODE_ENV === 'test') {
    return {
      presets: ['babel-preset-expo'],
    };
  }

  const gestureHandler = tryResolveModule(
    'expo-dev-menu/vendored/react-native-gesture-handler/src/index.ts'
  );
  const safeAreaContext = tryResolveModule(
    'expo-dev-menu/vendored/react-native-safe-area-context/src/index.tsx'
  );

  const gestureHandlerJest = tryResolveModule(
    'expo-dev-menu/vendored/react-native-gesture-handler/jestSetup.js'
  );

  const reanimated = tryResolveModule(
    'expo-dev-menu/vendored/react-native-reanimated/src/index.ts'
  );

  const alias = {};
  if (gestureHandler) {
    alias['react-native-gesture-handler/jestSetup'] = gestureHandlerJest;
    alias['react-native-gesture-handler'] = gestureHandler;
  }

  if (safeAreaContext) {
    alias['react-native-safe-area-context'] = safeAreaContext;
  }

  if (reanimated) {
    alias['react-native-reanimated'] = reanimated;
  }

  const moduleResolverConfig = {
    alias,
  };

  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['babel-plugin-module-resolver', moduleResolverConfig],
      'expo-dev-menu/vendored/react-native-reanimated/plugin.js',
    ],
  };
};
