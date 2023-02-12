import { NativeModules, Platform } from 'react-native';

type PlatformConstants = {
  forceTouchAvailable: boolean;
};

export default (NativeModules?.PlatformConstants ??
  Platform.constants) as PlatformConstants;
