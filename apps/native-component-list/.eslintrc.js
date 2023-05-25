module.exports = {
  root: true,
  plugins: ['expo'],
  extends: ['universe/native'],
  env: { browser: true },
  rules: {
    'expo/modern-react-native': ['error', { preserve: ['Linking'] }],
    'expo/no-vector-icon-barrel': 'error',
    // 'jsx-a11y/alt-text': [
    //   'warn',
    //   {
    //     elements: ['img'],
    //     img: ['Image'],
    //   },
    // ],
  },
  overrides: [
    {
      files: ['**/__tests__/*'],
      env: { node: true },
    },
  ],
};
