import { requireNativeView } from 'expo';
import { Children } from 'react';
import { View } from 'react-native';
import { DisclosureGroupProps } from './index.types';


/**
 * Displays a native DisclosureGroup
 *
 * @remarks
 *  Working on: Android reimplemtation with jetpack compose
 * 
 *
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
