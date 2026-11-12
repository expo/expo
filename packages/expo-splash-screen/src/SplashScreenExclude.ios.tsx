import { requireNativeView } from 'expo';
import { View } from 'react-native';

import type { SplashScreenExcludeProps } from './SplashScreenExclude.types';

const NativeExcludeView = requireNativeView<SplashScreenExcludeProps>('ExpoSplashScreen', 'SplashScreenExcludeView');

declare const globalThis: { __EXPO_SPLASH_PRERENDER__?: boolean };

/**
 * Keeps its children out of the launch screen prerender (the on-device snapshot and the build-time
 * template) while keeping their box, so greetings, balances and other personal or time-dependent
 * content never show up before the app is running.
 */
export function SplashScreenExclude({ placeholderColor, children, style, ...props }: SplashScreenExcludeProps) {
  if (globalThis.__EXPO_SPLASH_PRERENDER__) {
    // Rendering the build-time template: the box without its content.
    return <View {...props} style={[style, placeholderColor ? { backgroundColor: placeholderColor } : null]} />;
  }
  return (
    <NativeExcludeView {...props} style={style} placeholderColor={placeholderColor}>
      {children}
    </NativeExcludeView>
  );
}
