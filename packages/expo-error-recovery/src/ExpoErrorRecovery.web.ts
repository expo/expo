import { canUseDOM } from 'fbjs/lib/ExecutionEnvironment';
const LOCAL_STORAGE_KEY = 'EXPO_ERROR_RECOVERY_STORAGE';

function _consumeRecoveryProps(): string | null {
  if (!canUseDOM) return null;
  const props = localStorage.getItem(LOCAL_STORAGE_KEY);
  localStorage.removeItem(LOCAL_STORAGE_KEY);
  return props;
}

export default {
  get name(): string {
    return 'ExpoErrorRecovery';
  },

  saveRecoveryProps(props: string): void {
    if (!canUseDOM) return;
    localStorage.setItem(LOCAL_STORAGE_KEY, props);
  },

  recoveredProps: _consumeRecoveryProps(),
};
