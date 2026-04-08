/**
 * A re-export of `react-native-worklets` that supports optional dependency.
 */

let worklets: undefined | typeof import('react-native-worklets');
try {
  worklets = require('react-native-worklets');
} catch (e) {
  // Fail silently as worklet support is currently optional in Expo UI
}

export { worklets };
