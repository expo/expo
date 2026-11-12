import { View } from 'react-native';

import type { SplashScreenExcludeProps } from './SplashScreenExclude.types';

/**
 * Keeps its children out of the launch screen prerender (the on-device snapshot and the build-time
 * template) while keeping their box, so greetings, balances and other personal or time-dependent
 * content never show up before the app is running. Renders a plain `View` on platforms without the
 * prerender.
 */
export function SplashScreenExclude({ placeholderColor, children, ...props }: SplashScreenExcludeProps) {
  return <View {...props}>{children}</View>;
}
