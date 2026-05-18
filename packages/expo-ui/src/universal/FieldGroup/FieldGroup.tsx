import { ScrollView, StyleSheet, useColorScheme } from 'react-native';

import { groupFieldGroupChildren } from './groupChildren';
import type { FieldGroupProps } from './types';
import { useUniversalLifecycle } from '../hooks';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f2f2f7',
    flex: 1,
  },
  containerDark: {
    backgroundColor: '#000000',
  },
  hidden: {
    display: 'none',
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 24,
  },
});

/**
 * A scrollable container for grouped settings-style rows, mirroring the look
 * of an iOS Settings screen. Render one or more
 * [`FieldGroup.Section`](#fieldgroupsection) components inside. Direct
 * non-section children are automatically grouped into an implicit section,
 * matching SwiftUI `Form` behavior.
 */
export function FieldGroup({
  children,
  style,
  onAppear,
  onDisappear,
  hidden = false,
  testID,
}: FieldGroupProps) {
  useUniversalLifecycle(onAppear, onDisappear);

  const isDarkScheme = useColorScheme() === 'dark';

  return (
    <ScrollView
      style={[
        styles.container,
        isDarkScheme && styles.containerDark,
        style,
        hidden && styles.hidden,
      ]}
      contentContainerStyle={styles.contentContainer}
      testID={testID}>
      {groupFieldGroupChildren(children)}
    </ScrollView>
  );
}
