module.exports = {
  name: 'expo/eslint/react',
  plugins: {
    react: require('eslint-plugin-react'),
    'react-hooks': require('eslint-plugin-react-hooks'),
  },
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

    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
  },
  settings: {
    react: { version: 'detect' },
  },
};
