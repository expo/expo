module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: '@bacons/mdx/jsx' }]],
  };
};
