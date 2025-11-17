import { requireNativeView } from 'expo';

import { type CommonViewModifierProps } from '../types';

export type DividerProps = CommonViewModifierProps;

const DividerNativeView: React.ComponentType<DividerProps> = requireNativeView(
  'ExpoUI',
  'DividerView'
);

/**
 * Divider component uses the native [Divider](https://developer.apple.com/documentation/swiftui/divider) component.
 * A visual element that can be used to separate other content.
 */
export function Divider(props: DividerProps) {
  return <DividerNativeView {...props} />;
}
