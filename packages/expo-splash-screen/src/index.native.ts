import { requireNativeModule } from 'expo-modules-core';

export const { preventAutoHideAsync, hideAsync } = requireNativeModule('ExpoSplashScreen') as {
  preventAutoHideAsync: () => Promise<boolean>;
  hideAsync: () => Promise<boolean>;
};
