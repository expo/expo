import { requireNativeView } from 'expo';
import type { ComponentType } from 'react';
import { StyleSheet, type ViewProps } from 'react-native';

type NativeProps = ViewProps & {
  containerType: 'nativeTabs' | 'stack';
};

const NativeScrollViewHierarchyDetector: ComponentType<NativeProps> | null =
  process.env.NODE_ENV !== 'production'
    ? requireNativeView('ExpoRouterScrollViewDetector', 'RouterScrollViewDetectorView')
    : null;

export function ScrollViewHierarchyDetector({ containerType }: Pick<NativeProps, 'containerType'>) {
  if (!NativeScrollViewHierarchyDetector) {
    return null;
  }

  return (
    <NativeScrollViewHierarchyDetector
      containerType={containerType}
      pointerEvents="none"
      style={styles.detector}
      testID="expo-router-scroll-view-detector"
    />
  );
}

const styles = StyleSheet.create({
  detector: {
    position: 'absolute',
    width: 1,
    height: 1,
  },
});
