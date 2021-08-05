module.exports = function(api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { runtime: 'automatic' }]],
    plugins: ['react-native-reanimated/plugin'],
  };
};
