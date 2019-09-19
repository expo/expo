module.exports = {
  presets: ['next/babel'],
  plugins: [
    [
      'module-resolver',
      {
        alias: {
          '~': '.',
        },
      },
    ],
    'preval',
  ],
};
