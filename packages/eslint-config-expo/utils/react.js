module.exports = {
  parserOptions: { ecmaFeatures: { jsx: true } },
  plugins: ['react'],
  extends: ['plugin:react-hooks/recommended'],
  rules: {
    'react/display-name': 'warn',
    'react/jsx-no-duplicate-props': 'error',
    'react/jsx-no-undef': 'error',
    'react/jsx-uses-react': 'warn',
    'react/jsx-uses-vars': 'warn',
    'react/no-danger-with-children': 'warn',
    'react/no-deprecated': 'warn',
    'react/no-direct-mutation-state': 'warn',
    'react/no-string-refs': ['warn', { noTemplateLiterals: true }],
    'react/no-this-in-sfc': 'warn',
    'react/no-unknown-property': 'warn',
    'react/require-render-return': 'warn',
  },
  settings: {
    react: { version: 'detect' },
  },
};
