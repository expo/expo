import { defineConfig } from 'oxlint';

/**
 * React and React Hooks rules.
 *
 * Only includes non-formatting rules that oxlint supports.
 * JSX formatting rules (indentation, spacing, etc.) are omitted — use oxfmt.
 */
export default defineConfig({
  plugins: ['react'],
  rules: {
    'react/jsx-boolean-value': ['warn', 'never'],
    'react/jsx-curly-brace-presence': ['warn', 'never'],
    'react/jsx-fragments': ['warn', 'syntax'],
    'react/jsx-no-duplicate-props': 'error',
    'react/jsx-no-undef': 'error',
    'react/no-did-mount-set-state': 'warn',
    'react/no-direct-mutation-state': 'warn',
    'react/no-redundant-should-component-update': 'warn',
    'react/no-this-in-sfc': 'warn',
    'react/no-unknown-property': 'warn',
    'react/no-will-update-set-state': 'warn',
    'react/require-render-return': 'warn',
    'react/self-closing-comp': 'warn',

    'react/rules-of-hooks': 'error',
    'react/exhaustive-deps': 'off',
  },
});
