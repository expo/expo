const pluginReact = require('eslint-plugin-react');
const pluginReactHooks = require('eslint-plugin-react-hooks');

const { reactRules } = require('../../shared/rules');

module.exports = [
  {
    plugins: {
      react: pluginReact,
      'react-hooks': pluginReactHooks,
    },

    settings: {
      react: {
        version: 'detect',
      },
    },

    rules: {
      ...pluginReact.configs.recommended.rules,
      ...pluginReactHooks.configs.recommended.rules,
      ...reactRules,
    },
  },
];
