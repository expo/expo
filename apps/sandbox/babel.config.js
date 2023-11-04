module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          disableImportExportTransform: true,
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
