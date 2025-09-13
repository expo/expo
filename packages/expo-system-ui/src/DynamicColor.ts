import { Appearance } from 'react-native';

import ExpoSystemUI from './ExpoSystemUI';

function NativeDynamicColor(name: string, scheme: 'light' | 'dark'): string | null {
  if (process.env.EXPO_OS === 'android') {
    return ExpoSystemUI.DynamicColor(name, scheme);
  }
  return null;
}

export function DynamicColor(name: string): string | null {
  const scheme = Appearance.getColorScheme();
  if (scheme) {
    return NativeDynamicColor(name, scheme);
  }
  return null;
}

export function ContentBasedDynamicColor(name: string, base64Bitmap: string): string | null {
  if (process.env.EXPO_OS === 'android') {
    return ExpoSystemUI.ContentBasedDynamicColor(name, base64Bitmap);
  }
  return null;
}
