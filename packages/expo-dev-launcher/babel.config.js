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

  const rnSvg = tryResolveModule('./vendored/react-native-svg/src/index.ts');

  const alias = {};
  if (rnSvg) {
    alias['react-native-svg'] = rnSvg;
  }

  const moduleResolverConfig = {
    alias,
  };

  return {
    presets: ['babel-preset-expo'],
    plugins: [['babel-plugin-module-resolver', moduleResolverConfig]],
  };
};
