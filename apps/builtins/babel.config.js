module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          disableDeepImportWarnings: true,
          // Turn off fast refresh since it isn't included in the custom metro runtime.
          enableReactFastRefresh: false,
        },
      ],
    ]
  };
};
