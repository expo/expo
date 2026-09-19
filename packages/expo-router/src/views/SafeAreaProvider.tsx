'use client';

import type { PropsWithChildren } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { Metrics } from 'react-native-safe-area-context';

export type SafeAreaProviderProps = PropsWithChildren<{
  initialMetrics?: Metrics | null;
  style?: StyleProp<ViewStyle>;
}>;

// Native uses the upstream provider directly. Only web needs the streaming-SSR
// handling in `SafeAreaProvider.web.tsx`.
export { SafeAreaProvider } from 'react-native-safe-area-context';
