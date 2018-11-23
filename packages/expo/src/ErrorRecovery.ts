import { NativeModules } from 'react-native';
import UnsupportedError from './UnsupportedError';

const {
  ExponentErrorRecovery = {
    get name() {
      return 'ExponentErrorRecovery';
    },
  },
} = NativeModules;

export default {
  setRecoveryProps(props: { [key: string]: any }): void {
    if (!ExponentErrorRecovery.setRecoveryProps) {
      throw new UnsupportedError('ErrorRecovery', 'setRecoveryProps');
    }

    return ExponentErrorRecovery.setRecoveryProps(props);
  },
};
