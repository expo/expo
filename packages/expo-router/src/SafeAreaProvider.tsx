'use client';

import type { RefAttributes } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  SafeAreaFrameContext,
  SafeAreaInsetsContext,
  SafeAreaProvider as UpstreamSafeAreaProvider,
  type SafeAreaProviderProps,
} from 'react-native-safe-area-context';

const ZERO_INSETS = Object.freeze({ top: 0, right: 0, bottom: 0, left: 0 });
const ZERO_FRAME = Object.freeze({ x: 0, y: 0, width: 0, height: 0 });

function WebSafeAreaProvider({
  children,
  initialMetrics: _initialMetrics,
  initialSafeAreaInsets: _initialSafeAreaInsets,
  style,
  ...props
}: SafeAreaProviderProps & RefAttributes<View>) {
  // Measuring and updating these contexts can discard pending streamed content during hydration.
  return (
    <View {...props} style={[styles.container, style]}>
      <SafeAreaFrameContext.Provider value={ZERO_FRAME}>
        <SafeAreaInsetsContext.Provider value={ZERO_INSETS}>
          {children}
        </SafeAreaInsetsContext.Provider>
      </SafeAreaFrameContext.Provider>
    </View>
  );
}

export const SafeAreaProvider =
  process.env.EXPO_OS === 'web' ? WebSafeAreaProvider : UpstreamSafeAreaProvider;

const styles = StyleSheet.create({
  container: { flex: 1 },
});
