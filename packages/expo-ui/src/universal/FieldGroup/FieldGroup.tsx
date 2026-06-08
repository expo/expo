import { ScrollView, StyleSheet } from 'react-native';

import { groupFieldGroupChildren } from './groupChildren';
import type { FieldGroupProps } from './types';
import { useUniversalLifecycle } from '../hooks';
import { colors } from '../webUtils';

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.gray[50],
    flex: 1,
  },
  hidden: {
    display: 'none',
  },
  contentContainer: {
    gap: 24,
    padding: 16,
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

  return (
    <ScrollView
      style={[styles.container, style, hidden && styles.hidden]}
      contentContainerStyle={styles.contentContainer}
      testID={testID}>
      {groupFieldGroupChildren(children)}
    </ScrollView>
  );
}
