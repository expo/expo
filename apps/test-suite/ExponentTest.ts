import getenv from 'getenv';
import { NativeModules } from 'react-native';

type ExponentTestType = {
  isInCI: boolean;
  log: (...args: unknown[]) => void;
  completed: (results: string) => void;
  action: (action: object) => void;
};

let ExponentTest: ExponentTestType | undefined;

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
    completed() {},
    action() {},
  };
}

export default ExponentTest as ExponentTestType;
