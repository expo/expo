function tryResolveModule(module) {
  try {
    return require.resolve(module);
  } catch {
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

  const safeAreaContext = tryResolveModule(
    'expo-dev-menu/vendored/react-native-safe-area-context/src/index.tsx'
  );

  const alias = {
    'react-native-gesture-handler': tryResolveModule(
      'expo-dev-menu/mocks/react-native-gesture-handler/src/index.tsx'
    ),
  };

  if (safeAreaContext) {
    alias['react-native-safe-area-context'] = safeAreaContext;
  }

  const moduleResolverConfig = {
    alias,
  };

  return {
    presets: ['babel-preset-expo'],
    plugins: [['babel-plugin-module-resolver', moduleResolverConfig]],
  };
};
