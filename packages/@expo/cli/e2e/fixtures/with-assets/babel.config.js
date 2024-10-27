module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        // `babel-preset-expo` from the monorepo.
        process.env.TEST_BABEL_PRESET_EXPO_MODULE_ID,
        { web: { disableImportExportTransform: false } },
      ],
    ],
  };
};
