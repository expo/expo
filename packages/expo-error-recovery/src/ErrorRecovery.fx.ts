import { canUseDOM } from 'fbjs/lib/ExecutionEnvironment';
import { Platform } from 'react-native';

import { getRecoveryPropsToSave } from './ErroRecoveryStore';
import ExpoErrorRecovery from './ExpoErrorRecovery';

if (Platform.OS !== 'web') {
  const globalHandler = ErrorUtils.getGlobalHandler();
  // ErrorUtils came from react-native
  // https://github.com/facebook/react-native/blob/1151c096dab17e5d9a6ac05b61aacecd4305f3db/Libraries/vendor/core/ErrorUtils.js#L25
  ErrorUtils.setGlobalHandler(async (error, isFatal) => {
    if (ExpoErrorRecovery.saveRecoveryProps) {
      await ExpoErrorRecovery.saveRecoveryProps(getRecoveryPropsToSave());
    }
    globalHandler(error, isFatal);
  });
} else if (Platform.OS === 'web' && canUseDOM) {
  window.addEventListener('error', () => {
    ExpoErrorRecovery.saveRecoveryProps(getRecoveryPropsToSave());
  });
}
