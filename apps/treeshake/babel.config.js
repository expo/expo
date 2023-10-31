module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          native: {
            disableImportExportTransform: true,
          },
          web: {
            disableImportExportTransform: true,
          },
        },
      ],
    ],
  };
};
