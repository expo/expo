import { NativeModules } from 'react-native';

const { ExponentErrorRecovery } = NativeModules;

export default {
  setRecoveryProps(props: { [key: string]: any }): void {
    return ExponentErrorRecovery.setRecoveryProps(props);
  },
};
