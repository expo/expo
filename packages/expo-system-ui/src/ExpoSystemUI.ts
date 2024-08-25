import { requireNativeModule } from 'expo-modules-core';
import { ColorValue } from 'react-native';

export type SystemBarsConfig = {
  statusBarStyle: 'light' | 'dark' | undefined;
  statusBarHidden: boolean | undefined;
  navigationBarHidden: boolean | undefined;
};

export type ExpoSystemUIModule = {
  getBackgroundColorAsync: () => Promise<ColorValue | null>;
  setBackgroundColorAsync: (color: ColorValue | null) => Promise<void>;
  setSystemBarsConfigAsync: (config: SystemBarsConfig) => Promise<void>;
};

export default requireNativeModule<ExpoSystemUIModule>('ExpoSystemUI');
