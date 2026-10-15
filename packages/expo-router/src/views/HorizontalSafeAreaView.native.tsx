import { use, type ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { DisableAutomaticHorizontalSafeAreaInsetsContext } from './DisableAutomaticHorizontalSafeAreaInsetsContext';

const HORIZONTAL_EDGES: Edge[] = ['left', 'right'];

export function HorizontalSafeAreaView({ children }: { children: ReactNode }) {
  if (use(DisableAutomaticHorizontalSafeAreaInsetsContext)) {
    return children;
  }
  return (
    <SafeAreaView edges={HORIZONTAL_EDGES} style={styles.container}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
