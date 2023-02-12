import getenv from 'getenv';
import { NativeModules } from 'react-native';

// Used for bare android device farm builds
let ExponentTest;

try {
  if (NativeModules) {
    ExponentTest = NativeModules.ExponentTest;
  }
} catch {}

if (!ExponentTest) {
  ExponentTest = {
    get isInCI() {
      return getenv.boolish('CI', false);
    },
    log: console.log,
    completed() {
      // noop
    },
    action() {
      // noop
    },
  };
}

export default ExponentTest;
