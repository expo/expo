module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['expo'],
    plugins: ['@babel/transform-runtime'],
  };
};
