import getenv from 'getenv';
import { NativeModules } from 'react-native';

// Used for bare android device farm builds
const ExponentTest = (NativeModules && NativeModules.ExponentTest) || {
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

export default ExponentTest;
