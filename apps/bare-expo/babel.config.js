module.exports = function (api) {
  api.cache(true);

  return {
    presets: [
      [
        'babel-preset-expo',
        {
          // react-native-macos 0.81 only supports Hermes V0
          macos: { unstable_transformProfile: 'hermes-v0' },
        },
      ],
    ],
  };
};
