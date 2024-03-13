module.exports = function (api) {
  api.cache(true);

  return {
    presets: [
      [
        'babel-preset-expo',
        { 'babel-plugin-react-forget': process.env.EXPO_USE_FORGET ? true : false },
      ],
    ],
  };
};
