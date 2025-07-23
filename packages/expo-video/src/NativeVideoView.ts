import { requireNativeViewManager } from 'expo-modules-core';
import { Platform } from 'react-native';

const defaultViewName = Platform.OS === 'android' ? 'SurfaceVideoView' : 'VideoView';

export default requireNativeViewManager('ExpoVideo', defaultViewName);
export const NativeTextureVideoView =
  Platform.OS === 'android' ? requireNativeViewManager('ExpoVideo', 'TextureVideoView') : null;
