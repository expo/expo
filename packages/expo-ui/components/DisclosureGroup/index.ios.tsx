import { requireNativeView } from 'expo';
import { Children } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';


/**
 * Displays a native DisclosureGroup
 *
 * @remarks
 *  Working on: Android reimplemtation with jetpack compose
 * 
 *
 */

export type DisclosureGroupProps = {
  /**
   * Title of the DisclosureGroup.
   */
  title: string;

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
