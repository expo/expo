// AppRegistry transitively installs YellowBox as a side effect, which overrides various console
// methods that we need to set up before we override them
import { AppRegistry } from 'react-native';

const _unusedAppRegistry = AppRegistry;

// NOTE(2018-10-29): temporarily filter out cyclic dependency warnings here since they are noisy and
// each warning symbolicates a stack trace, which is slow when there are many warnings
const originalWarn = console.warn;
console.warn = function warn(...args) {
  if (
    args.length > 0 &&
    typeof args[0] === 'string' &&
    /^Require cycle: .*node_modules/.test(args[0])
  ) {
    return;
  }
  originalWarn.apply(console, args);
};

const originalError = console.error;
console.error = function error(...args) {
  if (
    args.length > 0 &&
    typeof args[0] === 'string' &&
    /^Warning: .* has been extracted/.test(args[0])
  ) {
    return;
  }
  originalError.apply(console, args);
};
