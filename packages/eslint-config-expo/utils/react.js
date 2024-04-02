module.exports = {
  parserOptions: { ecmaFeatures: { jsx: true } },
  extends: [
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ],
  rules: {
    'react/jsx-no-duplicate-props': 'error',
    'react/jsx-no-undef': 'error',
    'react/jsx-uses-react': 'warn',
    'react/jsx-uses-vars': 'warn',
    'react/no-direct-mutation-state': 'warn',
    'react/no-this-in-sfc': 'warn',
    'react/no-unknown-property': 'warn',
    'react/require-render-return': 'warn',
    'react/react-in-jsx-scope': 'off',
  },
  settings: {
    react: { version: 'detect' },
  },
};
