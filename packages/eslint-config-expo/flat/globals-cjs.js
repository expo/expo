module.exports = {
  name: 'expo/eslint/node',
  files: ['**/{app,babel,eslint,jest,prettier,metro}.config.js'],
  languageOptions: {
    globals: {
      __dirname: 'readonly',
      __filename: 'readonly',
    },
  },
};
