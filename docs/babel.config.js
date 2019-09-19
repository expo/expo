module.exports = {
  presets: ['next/babel'],
  plugins: [
    [
      'babel-plugin-module-resolver',
      {
        alias: {
          '~': '.',
        },
      },
    ],
    'preval',
  ],
};
