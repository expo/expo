import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { StyleSheet, View } from 'react-native';

/**
 * A view that is aware of the bottom tab bar height.
 */
export function TabsAwareView({ children }: { children: React.ReactNode }) {
  const bottomTabBarHeight = useBottomTabBarHeight();
  return <View style={[styles.container, { paddingBottom: bottomTabBarHeight }]}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
