import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import type { UniversalHostProps } from './types';

const styles = StyleSheet.create({
  matchContents: {
    alignSelf: 'flex-start',
  },
  matchViewport: {
    height: '100dvh',
    width: '100dvw',
  },
  safeArea: {
    paddingLeft: 'max(env(safe-area-inset-left, 0px), env(keyboard-inset-left, 0px))',
    paddingRight: 'max(env(safe-area-inset-right, 0px), env(keyboard-inset-right, 0px))',
    paddingTop: 'max(env(safe-area-inset-top, 0px), env(keyboard-inset-top, 0px))',
    paddingBottom: 'max(env(safe-area-inset-bottom, 0px), env(keyboard-inset-bottom, 0px))',
  },
  safeAreaWithoutKeyboard: {
    paddingLeft: 'env(safe-area-inset-left, 0px)',
    paddingRight: 'env(safe-area-inset-right, 0px)',
    paddingTop: 'env(safe-area-inset-top, 0px)',
    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
  },
});

/**
 * A bridging container that hosts SwiftUI views on iOS and Jetpack Compose views on Android.
 * On platforms without a native UI-toolkit binding (web, RN fallback), renders a plain `View`.
 * The `colorScheme`, `layoutDirection`, and `matchContents` props are accepted for API parity but have no effect.
 */
export function Host({
  children,
  ignoreSafeArea,
  layoutDirection,
  matchContents = false,
  onLayout,
  onLayoutContent,
  style,
  useViewportSizeMeasurement = false,
  colorScheme: _colorScheme,
  ...rest
}: UniversalHostProps) {
  const shouldMatchContents =
    typeof matchContents === 'object'
      ? matchContents.horizontal || matchContents.vertical
      : matchContents;

  return (
    <View
      dir={
        layoutDirection === 'leftToRight'
          ? 'ltr'
          : layoutDirection === 'rightToLeft'
            ? 'rtl'
            : undefined
      }
      onLayout={(event: LayoutChangeEvent) => {
        onLayout?.(event);

        onLayoutContent?.({
          nativeEvent: {
            width: event.nativeEvent.layout.width,
            height: event.nativeEvent.layout.height,
          },
        });
      }}
      style={[
        ignoreSafeArea !== 'all' &&
          (ignoreSafeArea === 'keyboard' ? styles.safeAreaWithoutKeyboard : styles.safeArea),
        shouldMatchContents
          ? styles.matchContents
          : useViewportSizeMeasurement && styles.matchViewport,
        style,
      ]}
      {...rest}>
      {children}
    </View>
  );
}

export type { UniversalHostProps } from './types';
