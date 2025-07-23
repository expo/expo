const { defineConfig } = require('eslint/config');
const importPlugin = require('eslint-plugin-import');
const nodePlugin = require('eslint-plugin-n');
const globals = require('globals');

const { jsExtensions } = require('./extensions');

module.exports = defineConfig([
  importPlugin.flatConfigs.recommended,
  {
    plugins: {
      n: nodePlugin,
    },

    languageOptions: {
      globals: {
        ...globals.jest,
        console: false,
        exports: false,
        global: false,
        module: false,
        require: false,
      },

      ecmaVersion: 2022,
      sourceType: 'module',

      parserOptions: {
        ecmaFeatures: {
          impliedStrict: true,
          jsx: true,
        },
      },
    },

    settings: {
      'import/extensions': jsExtensions,
      'import/ignore': ['node_modules[\\\\/]+@?react-native'],

      'import/resolver': {
        node: {
          extensions: jsExtensions,
        },
      },
    },

    rules: {
      'array-bracket-spacing': ['warn', 'never'],

      'arrow-spacing': [
        'warn',
        {
          before: true,
          after: true,
        },
      ],

      curly: ['warn', 'all'],
      'block-spacing': ['warn', 'always'],
      'comma-dangle': ['warn', 'always-multiline'],

      'comma-spacing': [
        'warn',
        {
          before: false,
          after: true,
        },
      ],

      'comma-style': ['warn', 'last'],
      'computed-property-spacing': ['warn', 'never'],
      'constructor-super': 'warn',
      'dot-location': ['warn', 'property'],
      'eol-last': 'warn',
      eqeqeq: ['warn', 'smart'],
      'func-call-spacing': ['warn', 'never'],
      'generator-star-spacing': ['warn', 'after'],
      'getter-return': 'warn',
      'jsx-quotes': ['warn', 'prefer-double'],
      'new-parens': 'warn',
      'no-alert': 'off',
      'no-array-constructor': 'warn',
      'no-caller': 'warn',
      'no-case-declarations': 'warn',
      'no-compare-neg-zero': 'warn',
      'no-cond-assign': 'warn',
      'no-const-assign': 'error',

      'no-constant-condition': [
        'warn',
        {
          checkLoops: false,
        },
      ],

      'no-control-regex': 'off',
      'no-debugger': 'warn',
      'no-delete-var': 'error',
      'no-dupe-args': 'error',
      'no-dupe-class-members': 'error',
      'no-dupe-keys': 'error',
      'no-duplicate-case': 'error',
      'no-empty-character-class': 'warn',
      'no-empty-pattern': 'warn',
      'no-eval': 'warn',
      'no-ex-assign': 'warn',
      'no-extend-native': 'warn',
      'no-extra-bind': 'warn',
      'no-extra-boolean-cast': 'warn',
      'no-extra-semi': 'warn',
      'no-fallthrough': 'warn',
      'no-floating-decimal': 'warn',
      'no-func-assign': 'error',
      'no-global-assign': 'warn',
      'no-implied-eval': 'warn',
      'no-inner-declarations': 'warn',
      'no-invalid-regexp': 'error',
      'no-irregular-whitespace': 'warn',
      'no-iterator': 'warn',
      'no-label-var': 'warn',

      'no-labels': [
        'warn',
        {
          allowLoop: true,
          allowSwitch: true,
        },
      ],

      'no-lone-blocks': 'warn',
      'no-multi-assign': 'warn',
      'no-new': 'warn',
      'no-new-func': 'warn',
      'no-object-constructor': 'warn',
      'no-new-native-nonconstructor': 'error',
      'no-obj-calls': 'warn',
      'no-octal': 'warn',
      'no-octal-escape': 'warn',
      'no-mixed-spaces-and-tabs': 'warn',
      'no-proto': 'warn',
      'no-redeclare': 'warn',
      'no-return-assign': 'warn',
      'no-script-url': 'warn',
      'no-self-assign': 'warn',
      'no-self-compare': 'warn',
      'no-sequences': 'warn',
      'no-shadow-restricted-names': 'warn',
      'no-sparse-arrays': 'warn',
      'no-this-before-super': 'warn',
      'no-throw-literal': 'warn',
      'no-trailing-spaces': 'warn',
      'no-undef': 'error',
      'no-unexpected-multiline': 'warn',
      'no-unneeded-ternary': 'warn',
      'no-unreachable': 'warn',
      'no-unsafe-negation': 'warn',

      'no-unused-expressions': [
        'warn',
        {
          allowShortCircuit: true,
          enforceForJSX: true,
        },
      ],

      'no-unused-labels': 'warn',

      'no-unused-vars': [
        'warn',
        {
          vars: 'all',
          args: 'none',
          ignoreRestSiblings: true,
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      'no-useless-computed-key': 'warn',
      'no-useless-concat': 'warn',
      'no-useless-constructor': 'warn',
      'no-useless-escape': 'warn',
      'no-useless-rename': 'warn',
      'no-useless-return': 'warn',
      'no-var': 'warn',
      'no-void': 'warn',
      'no-whitespace-before-property': 'warn',
      'no-with': 'warn',
      'object-shorthand': 'warn',

      'operator-linebreak': [
        'warn',
        'after',
        {
          overrides: {
            '?': 'before',
            ':': 'before',
          },
        },
      ],

      'prefer-const': [
        'warn',
        {
          destructuring: 'all',
          ignoreReadBeforeAssign: true,
        },
      ],

      'prefer-promise-reject-errors': 'warn',
      'prefer-rest-params': 'warn',
      'prefer-spread': 'warn',
      radix: 'warn',
      'rest-spread-spacing': ['warn', 'never'],
      semi: 'warn',

      'semi-spacing': [
        'warn',
        {
          before: false,
          after: true,
        },
      ],

      'semi-style': ['warn', 'last'],
      'space-before-blocks': ['warn', 'always'],

      'space-before-function-paren': [
        'warn',
        {
          anonymous: 'never',
          named: 'never',
        },
      ],

      'space-in-parens': ['warn', 'never'],
      'space-infix-ops': 'warn',

      'switch-colon-spacing': [
        'warn',
        {
          before: false,
          after: true,
        },
      ],

      'template-curly-spacing': ['warn', 'never'],
      'template-tag-spacing': ['warn', 'never'],
      'unicode-bom': ['warn', 'never'],
      'use-isnan': 'error',
      'valid-typeof': 'error',
      'yield-star-spacing': ['warn', 'after'],

      yoda: [
        'warn',
        'never',
        {
          exceptRange: true,
        },
      ],

      'import/default': 'off',
      'import/export': 'error',
      'import/first': 'warn',

      'import/namespace': [
        'error',
        {
          allowComputed: true,
        },
      ],

      'import/no-duplicates': 'error',

      // TODO (Kadi): Enable this. Disabling for now because import/recommended adds it, but we didn't use to have it enabled
      'import/no-unresolved': 'off',

      'import/order': [
        'warn',
        {
          groups: [['builtin', 'external'], 'internal', ['parent', 'index', 'sibling']],
          'newlines-between': 'always',

          alphabetize: {
            order: 'asc',
          },
        },
      ],

      'n/handle-callback-err': ['warn', '^(e|err|error|.+Error)$'],
      'n/no-new-require': 'warn',
    },
  },
  {
    files: ['**/*.d.ts'],

    rules: {
      'import/order': 'off',
    },
  },
]);
