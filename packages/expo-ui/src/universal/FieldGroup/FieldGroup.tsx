import { ScrollView, type ViewStyle } from 'react-native';

import { groupFieldGroupChildren } from './groupChildren';
import type { FieldGroupProps } from './types';
import { useUniversalLifecycle } from '../hooks';

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
  hidden,
  testID,
}: FieldGroupProps) {
  useUniversalLifecycle(onAppear, onDisappear);

  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor: '#f2f2f7',
    ...style,
    ...(hidden ? { display: 'none' } : undefined),
  };

  return (
    <ScrollView
      style={containerStyle}
      contentContainerStyle={contentContainerStyle}
      testID={testID}>
      {groupFieldGroupChildren(children)}
    </ScrollView>
  );
}

const contentContainerStyle: ViewStyle = {
  paddingHorizontal: 16,
  paddingVertical: 16,
  gap: 24,
};
