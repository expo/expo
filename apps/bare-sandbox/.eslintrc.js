module.exports = {
  rules: {
    // Disable React JSX transform warnings because
    // `jsxRuntime: 'automatic'` is passed to `babel-preset-expo`.
    'react/jsx-uses-react': 'off',
    'react/react-in-jsx-scope': 'off',
  },
};
