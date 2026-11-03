module.exports = {
  extends: ['plugin:react/recommended', 'plugin:react-hooks/recommended'],
  rules: {
    'react/no-unknown-property': 'warn',
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'react/jsx-no-target-blank': 'off',
    'react/no-this-in-sfc': 'warn',
  },
  settings: {
    react: { version: 'detect' },
  },
};
