import * as React from 'react';
import {
  Dimensions,
  Platform,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import {
  initialWindowMetrics,
  SafeAreaInsetsContext,
  SafeAreaProvider,
} from 'react-native-safe-area-context';

import { FrameSizeProvider } from './useFrameSize';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

const { width = 0, height = 0 } = Dimensions.get('window');

// To support SSR on web, we need to have empty insets for initial values
// Otherwise there can be mismatch between SSR and client output
// We also need to specify empty values to support tests environments
const initialMetrics =
  Platform.OS === 'web' || initialWindowMetrics == null
    ? {
        frame: { x: 0, y: 0, width, height },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
      }
    : initialWindowMetrics;

export function SafeAreaProviderCompat({ children, style }: Props) {
  const insets = React.useContext(SafeAreaInsetsContext);

  return (
    <FrameSizeProvider
      initialFrame={initialMetrics.frame}
      render={({ ref, onLayout }) => {
        if (insets) {
          // If we already have insets, don't wrap the stack in another safe area provider
          // This avoids an issue with updates at the cost of potentially incorrect values
          // https://github.com/react-navigation/react-navigation/issues/174
          return (
            <View
              ref={ref}
              onLayout={onLayout}
              style={[styles.container, style]}
            >
              {children}
            </View>
          );
        }

        // SafeAreaProvider doesn't forward ref
        // So we only pass onLayout to it
        return (
          <SafeAreaProvider
            initialMetrics={initialMetrics}
            style={style}
            onLayout={onLayout}
          >
            {children}
          </SafeAreaProvider>
        );
      }}
    />
  );
}

SafeAreaProviderCompat.initialMetrics = initialMetrics;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
