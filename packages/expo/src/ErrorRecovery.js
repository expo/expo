// @flow

import { NativeModules } from 'react-native';

const { ExponentErrorRecovery } = NativeModules;

export default {
  setRecoveryProps(props: Object): void {
    return ExponentErrorRecovery.setRecoveryProps(props);
  },
};
