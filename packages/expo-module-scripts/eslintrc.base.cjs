module.exports = {
  root: true,
  extends: ['universe/native'],
  settings: {
    react: {
      version: '19'
    },
  },
  overrides: [
    {
      files: ['**/__tests__/*'],
      env: { node: true },
      globals: { __DEV__: true },
    },
    {
      files: ['./*.config.js', './.*rc.js'],
      extends: ['universe/node'],
    },

    {
      files: ['*.ts', '*.tsx', '*.d.ts'],
      rules: {
        // NOTE: This is already handled by TypeScript itself
        // Turning this on blocks legitimate type overloads
        // TODO(@kitten): Please move this to universe
        'no-redeclare': 'off',
        '@typescript-eslint/no-redeclare': 'off',

        // NOTE: Handled by TypeScript
        // TODO(@kitten): Please move this to universe
        'no-unused-expressions': 'off',
        'no-unused-vars': 'off',
        'no-useless-return': 'off',
        'no-unreachable': 'off',
        'no-undef': 'off',
        'no-dupe-keys': 'off',
        'no-dupe-class-members': 'off',
        'no-dupe-args': 'off',
        '@typescript-eslint/no-unused-expressions': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        'import/default': 'off',
        'import/export': 'off',
        'import/named': 'off',
        'import/namespace': 'off',
        'import/no-duplicates': 'off',
      }
    },
    {
      // TODO(@kitten): Scope these to JSX files in universe instead
      files: ['*.js', '*.ts', '*.d.ts'],
      rules: {
        'react/jsx-boolean-value': 'off',
        'react/jsx-closing-bracket-location': 'off',
        'react/jsx-curly-brace-presence': 'off',
        'react/jsx-curly-spacing': 'off',
        'react/jsx-equals-spacing': 'off',
        'react/jsx-first-prop-new-line': 'off',
        'react/jsx-fragments': 'off',
        'react/jsx-indent': 'off',
        'react/jsx-indent-props': 'off',
        'react/jsx-no-bind': 'off',
        'react/jsx-no-duplicate-props': 'off',
        'react/jsx-no-undef': 'off',
        'react/jsx-props-no-multi-spaces': 'off',
        'react/jsx-tag-spacing': 'off',
        'react/jsx-uses-react': 'off',
        'react/jsx-uses-vars': 'off',
        'react/jsx-wrap-multilines': 'off',
        'react/no-access-state-in-setstate': 'off',
        'react/no-did-mount-set-state': 'off',
        'react/no-did-update-set-state': 'off',
        'react/no-direct-mutation-state': 'off',
        'react/no-redundant-should-component-update': 'off',
        'react/no-this-in-sfc': 'off',
        'react/no-unknown-property': 'off',
        'react/no-will-update-set-state': 'off',
        'react/require-render-return': 'off',
        'react/self-closing-comp': 'off',
      },
    },
  ],
  rules: {
    'no-restricted-imports': [
      'warn',
      {
        // fbjs is a Facebook-internal package not intended to be a public API
        patterns: ['fbjs/*', 'fbjs'],
      },
    ],
  },
};
