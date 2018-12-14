module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['babel-plugin-react-native-web', '@babel/plugin-transform-runtime'],
  };
};
