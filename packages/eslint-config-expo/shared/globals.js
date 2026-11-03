// CommonJS and the console, available in every file.
const moduleGlobals = {
  console: 'readonly',
  exports: 'readonly',
  global: 'readonly',
  module: 'readonly',
  require: 'readonly',
};

// What the React Native runtime defines.
const reactNativeGlobals = {
  __DEV__: 'readonly',
  ErrorUtils: 'readonly',
  FormData: 'readonly',
  XMLHttpRequest: 'readonly',
  alert: 'readonly',
  cancelAnimationFrame: 'readonly',
  cancelIdleCallback: 'readonly',
  clearImmediate: 'readonly',
  fetch: 'readonly',
  navigator: 'readonly',
  process: 'readonly',
  requestAnimationFrame: 'readonly',
  requestIdleCallback: 'readonly',
  setImmediate: 'readonly',
  window: 'readonly',
};

module.exports = { moduleGlobals, reactNativeGlobals };
