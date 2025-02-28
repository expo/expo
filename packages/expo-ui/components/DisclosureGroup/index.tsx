import { requireNativeView } from 'expo';
import { Children } from 'react';
import { Platform, StyleProp, View, ViewStyle } from 'react-native';

export type DisclosureGroupProps = {
  /**
   * Title of the DisclosureGroup.
   */
  title: string;

  /**
   * Expandation state of the DisclosureGroup.
   */
  isExpanded?: boolean;

  /**
   * A callback that is called when the state chnages.
   */
  onStateChange?: (isExpanded: boolean) => void;

  /**
   * Additional styling.
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Content of the DisclosureGroup as children.
   */
  children: React.ReactNode;
};

/**
 * Displays a native DisclosureGroup
 */

const DisclosureGroupNativeView: React.ComponentType<DisclosureGroupProps> | null =
  Platform.OS === 'ios' ? requireNativeView('ExpoUI', 'DisclosureGroupView') : null;

export function DisclosureGroup(props: DisclosureGroupProps) {
  const children = Children.toArray(props.children);
  if (!DisclosureGroupNativeView) {
    return null;
  }
  return (
    <DisclosureGroupNativeView {...props} style={{ flex: 1 }}>
      <View>{children}</View>
    </DisclosureGroupNativeView>
  );
}
