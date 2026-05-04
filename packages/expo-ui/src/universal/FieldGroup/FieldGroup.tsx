import { ScrollView, useColorScheme, type ViewStyle } from 'react-native';

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

  const isDarkScheme = useColorScheme() === 'dark';

  return (
    <ScrollView
      style={[
        containerBaseStyle,
        isDarkScheme ? containerDarkStyle : containerLightStyle,
        style,
        hidden ? hiddenStyle : null,
      ]}
      contentContainerStyle={contentContainerStyle}
      testID={testID}>
      {groupFieldGroupChildren(children)}
    </ScrollView>
  );
}

const containerBaseStyle: ViewStyle = {
  flex: 1,
};

const containerLightStyle: ViewStyle = {
  backgroundColor: '#f2f2f7',
};

const containerDarkStyle: ViewStyle = {
  backgroundColor: '#000000',
};

const hiddenStyle: ViewStyle = {
  display: 'none',
};

const contentContainerStyle: ViewStyle = {
  paddingHorizontal: 16,
  paddingVertical: 16,
  gap: 24,
};
