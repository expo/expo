module.exports = function(api) {
  api.cache(true);
  return {
    plugins: [['@babel/plugin-transform-modules-commonjs', { lazy: true }]],
  };
};
