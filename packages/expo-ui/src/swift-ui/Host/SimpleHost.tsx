import { requireNativeView } from 'expo';
import { StyleProp, ViewStyle, type ColorSchemeName } from 'react-native';

import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

export type SimpleHostProps = {
  /**
   * The color scheme of the host view.
   */
  colorScheme?: ColorSchemeName;

  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
} & CommonViewModifierProps;

const HostNativeView: React.ComponentType<SimpleHostProps> = requireNativeView(
  'ExpoUI',
  'HostView'
);

/**
 * A hosting component for SwiftUI views.
 */
export function SimpleHost(props: SimpleHostProps) {
  const { modifiers, ...restProps } = props;

  return (
    <HostNativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}
      // @ts-expect-error
      measureableNode
    />
  );
}
