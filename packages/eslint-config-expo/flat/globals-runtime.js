const globals = require('globals');

module.exports = [
  {
    name: 'expo/eslint/runtime',
    languageOptions: {
      globals: {
        // Metro
        __DEV__: 'readonly',
        // React Native
        alert: 'readonly',
        cancelAnimationFrame: 'readonly',
        cancelIdleCallback: 'readonly',
        clearImmediate: 'readonly',
        clearInterval: 'readonly',
        clearTimeout: 'readonly',
        console: 'readonly',
        ErrorUtils: 'readonly',
        fetch: 'readonly',
        FormData: 'readonly',
        navigator: 'readonly',
        requestAnimationFrame: 'readonly',
        requestIdleCallback: 'readonly',
        setImmediate: 'readonly',
        setInterval: 'readonly',
        setTimeout: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        XMLHttpRequest: 'readonly',
        // Expo
        process: 'readonly',
        window: 'readonly',
      },
    },
  },
  {
    // TODO(cedric): this doesn't seem right
    name: 'expo/eslint/runtime-web',
    files: ['*.web.*'],
    languageOptions: {
      globals: globals.browser,
    }
  }
];
