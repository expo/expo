module.exports = function (api) {
  api.cache(true);

  return {
    presets: [
      [
        'babel-preset-expo',
        { 'babel-plugin-react-compiler': process.env.EXPO_USE_FORGET ? true : false },
      ],
    ],
  };
};
