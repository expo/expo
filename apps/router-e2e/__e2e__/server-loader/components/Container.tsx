import { Activity, createContext, type ReactNode, use } from 'react';
import { Platform, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ContainerProps {
  children: ReactNode;
}

export const LoaderActivityMode = createContext<'visible' | 'hidden'>('visible');

export function LoaderActivity({ children }: ContainerProps) {
  return <Activity mode={use(LoaderActivityMode)}>{children}</Activity>;
}

export function Container({ children }: ContainerProps) {
  const insets = useSafeAreaInsets();
  // Native test clients can report zero insets before their window attaches.
  const topInset = Platform.OS === 'web' ? insets.top : Math.max(insets.top, 60);
  return (
    <ScrollView
      style={[styles.container, { paddingTop: topInset + 20 }]}
      contentContainerStyle={styles.content}>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    padding: 20,
  },
  content: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 24,
  },
});
