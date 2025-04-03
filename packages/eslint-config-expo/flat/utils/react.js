const pluginReact = require('eslint-plugin-react');
const pluginReactHooks = require('eslint-plugin-react-hooks');

module.exports = [
  {
    plugins: {
      react: pluginReact,
      'react-hooks': pluginReactHooks,
    },

    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },

    settings: {
      react: {
        version: 'detect',
      },
    },

    rules: {
      ...pluginReactHooks.configs.recommended.rules,
      'react/display-name': 'warn',
      'react/jsx-no-duplicate-props': 'error',
      'react/jsx-no-undef': 'error',
      'react/jsx-uses-react': 'warn',
      'react/jsx-uses-vars': 'warn',
      'react/no-danger-with-children': 'warn',
      'react/no-deprecated': 'warn',
      'react/no-direct-mutation-state': 'warn',

      'react/no-string-refs': [
        'warn',
        {
          noTemplateLiterals: true,
        },
      ],

      'react/no-this-in-sfc': 'warn',
      'react/no-unknown-property': 'warn',
      'react/require-render-return': 'warn',
    },
  },
];
