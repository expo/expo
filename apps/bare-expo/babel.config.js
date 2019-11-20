module.exports = function(api) {
  api.cache(true);
  return {
    // [Custom] Needed for decorators
    presets: ['babel-preset-expo'],
  };
};
