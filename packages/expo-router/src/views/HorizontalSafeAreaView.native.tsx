import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { useDisableAutomaticHorizontalSafeAreaInsets } from './DisableAutomaticHorizontalSafeAreaInsetsContext';

const HORIZONTAL_EDGES: Edge[] = ['left', 'right'];
const VERTICAL_EDGES: Edge[] = ['top', 'bottom'];

export function HorizontalSafeAreaView({ children }: { children: ReactNode }) {
  if (useDisableAutomaticHorizontalSafeAreaInsets()) {
    return children;
  }
  return (
    <SafeAreaView edges={HORIZONTAL_EDGES} style={styles.container}>
      {children}
    </SafeAreaView>
  );
}

// Edges for the `SafeAreaView` of the default navigator. When the screen applies left and right
// insets, only top and bottom are left.
export function useDefaultNavigatorSafeAreaEdges() {
  return useDisableAutomaticHorizontalSafeAreaInsets() ? undefined : VERTICAL_EDGES;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
