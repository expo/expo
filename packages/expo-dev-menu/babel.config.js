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
  } else {
    const gestureHandler = tryResolveModule('./vendored/react-native-gesture-handler/src/index.ts');
    const gestureHandlerJest = tryResolveModule(
      './vendored/react-native-gesture-handler/jestSetup.js'
    );
    const safeAreaContext = tryResolveModule(
      './vendored/react-native-safe-area-context/src/index.tsx'
    );

    const alias = {};
    if (gestureHandler) {
      alias['react-native-gesture-handler/jestSetup'] = gestureHandlerJest;
      alias['react-native-gesture-handler'] = gestureHandler;
    }


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
  }
};
