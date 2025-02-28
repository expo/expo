import { requireNativeView } from 'expo';
import { Children } from 'react';
import { StyleProp, TextStyle, View, ViewStyle } from 'react-native';


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
 *
 * @remarks
 *  Working on: Android reimplemtation with jetpack compose
 */

const DisclosureGroupNativeView: React.ComponentType<DisclosureGroupProps> = requireNativeView(
  'ExpoUI',
  'DisclosureGroupView'
);

export function DisclosureGroup(props: DisclosureGroupProps) {
  const children = Children.toArray(props.children);
  return (
    <DisclosureGroupNativeView {...props} style={{ flex: 1 }}>
      <View>{children}</View>
    </DisclosureGroupNativeView>
  );
}
