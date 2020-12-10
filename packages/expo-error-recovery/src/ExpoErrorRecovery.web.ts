import { canUseDOM } from 'fbjs/lib/ExecutionEnvironment';
const LOCAL_STORAGE_KEY = 'EXPO_ERROR_RECOVERY_STORAGE';

function _consumeRecoveryProps(): string | null {
  if (!canUseDOM) return null;
  try {
    const props = localStorage.getItem(LOCAL_STORAGE_KEY);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    return props;
  } catch (e) {
    // Catches localStorage SecurityError https://github.com/expo/expo/issues/8355
  }
  return null;
}

export default {
  get name(): string {
    return 'ExpoErrorRecovery';
  },

  saveRecoveryProps(props: string): void {
    if (!canUseDOM) return;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, props);
    } catch (e) {
      // Catches localStorage SecurityError https://github.com/expo/expo/issues/8355
    }
  },

  recoveredProps: _consumeRecoveryProps(),
};
