import { Platform } from '@unimodules/core';
const LOCAL_STORAGE_KEY = 'EXPO_ERROR_RECOVERY_STORAGE';

function _consumeRecoveryProps(): string | null {
  if (!Platform.isDOMAvailable) return null;
  const props = localStorage.getItem(LOCAL_STORAGE_KEY);
  localStorage.removeItem(LOCAL_STORAGE_KEY);
  return props;
}

export default {
  get name(): string {
    return 'ExpoErrorRecovery';
  },

  saveRecoveryProps(props: string): void {
    if (!Platform.isDOMAvailable) return;
    localStorage.setItem(LOCAL_STORAGE_KEY, props);
  },

  recoveredProps: _consumeRecoveryProps(),
};
