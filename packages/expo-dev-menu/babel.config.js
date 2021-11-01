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

  const gestureHandler = tryResolveModule('./vendored/react-native-gesture-handler/src/index.js');
  const reanimated = tryResolveModule('./vendored/react-native-reanimated/src/Animated.js');

  const alias = {};
  if (gestureHandler) {
    alias['react-native-gesture-handler'] = gestureHandler;
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
      './vendored/react-native-reanimated/plugin.js',
    ],
  };
};
