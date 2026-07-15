import { requireNativeView } from 'expo';
import { Platform } from 'react-native';

const defaultViewName = Platform.OS === 'android' ? 'SurfaceVideoView' : 'VideoView';

export default requireNativeView('ExpoVideo', defaultViewName);
export const NativeTextureVideoView =
  Platform.OS === 'android' ? requireNativeView('ExpoVideo', 'TextureVideoView') : null;
