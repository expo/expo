import { useCallback } from 'react';
import {
  StyleSheet,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
  type ViewProps,
} from 'react-native';

const styles = StyleSheet.create({
  matchContents: {
    alignSelf: 'flex-start',
  },
  safeAreaAll: {
    paddingLeft: 'env(safe-area-inset-left, 0px)',
    paddingRight: 'env(safe-area-inset-right, 0px)',
    paddingTop: 'env(safe-area-inset-top, 0px)',
    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
  },
  safeAreaKeyboard: {
    paddingLeft: 'max(env(safe-area-inset-left, 0px), env(keyboard-inset-left, 0px))',
    paddingRight: 'max(env(safe-area-inset-right, 0px), env(keyboard-inset-right, 0px))',
    paddingTop: 'max(env(safe-area-inset-top, 0px), env(keyboard-inset-top, 0px))',
    paddingBottom: 'max(env(safe-area-inset-bottom, 0px), env(keyboard-inset-bottom, 0px))',
  },
});

type HostProps = {
  ignoreSafeArea?: 'all' | 'keyboard';
  layoutDirection?: 'leftToRight' | 'rightToLeft';
  matchContents?: boolean | { horizontal?: boolean; vertical?: boolean };
  onLayoutContent?: (event: { nativeEvent: { width: number; height: number } }) => void;
  useViewportSizeMeasurement?: boolean;
};

/**
 * A bridging container that hosts SwiftUI views on iOS and Jetpack Compose views on Android.
 */
export function Host({
  children,
  ignoreSafeArea,
  layoutDirection = 'leftToRight',
  matchContents = false,
  onLayout,
  onLayoutContent,
  style,
  useViewportSizeMeasurement = false,
  ...rest
}: ViewProps & HostProps) {
  const windowDimensions = useWindowDimensions();

  const shouldMatchContents =
    typeof matchContents === 'object'
      ? matchContents.horizontal || matchContents.vertical
      : matchContents;

  const handleOnLayout = useCallback((event: LayoutChangeEvent) => {
    onLayout?.(event);

    onLayoutContent?.({
      nativeEvent: {
        width: event.nativeEvent.layout.width,
        height: event.nativeEvent.layout.height,
      },
    });
  }, []);

  return (
    <View
      dir={layoutDirection === 'leftToRight' ? 'ltr' : 'rtl'}
      onLayout={handleOnLayout}
      style={[
        ignoreSafeArea != null &&
          (ignoreSafeArea === 'keyboard' ? styles.safeAreaKeyboard : styles.safeAreaAll),
        shouldMatchContents
          ? styles.matchContents
          : useViewportSizeMeasurement && {
              width: windowDimensions.width,
              height: windowDimensions.height,
            },
        style,
      ]}
      {...rest}>
      {children}
    </View>
  );
}
