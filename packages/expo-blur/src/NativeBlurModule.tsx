import { requireNativeView } from 'expo';
import { View } from 'react-native';

export const NativeBlurView = requireNativeView('ExpoBlur', 'ExpoBlurView');

export const NativeBlurTargetView = View;
