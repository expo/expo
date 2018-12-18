module.exports = function(api) {
  api.cache(true);
  const plugins = process.env.REACT_NATIVE_APP_ROOT
    ? ['@babel/plugin-transform-runtime']
    : ['babel-plugin-react-native-web', '@babel/plugin-transform-runtime'];
  return {
    presets: ['babel-preset-expo'],
    plugins,
  };
};
