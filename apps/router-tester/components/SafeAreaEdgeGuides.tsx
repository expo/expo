import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Draws a dashed guide on each horizontal safe-area edge that has an inset, over the children.
 * Beside the iPhone Duo rail that edge is where the large title starts, so content that should
 * line up with the title should touch the guide.
 */
export function SafeAreaEdgeGuides({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {children}
      {insets.left > 0 && (
        <View pointerEvents="none" style={[styles.guide, { left: insets.left }]} />
      )}
      {insets.right > 0 && (
        <View pointerEvents="none" style={[styles.guide, { right: insets.right }]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  guide: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 0,
    borderLeftWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#dc2626',
  },
});
