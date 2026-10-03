import { requireNativeLayoutView } from '../../requireNativeLayoutView';
import { type CommonViewModifierProps } from '../types';

export interface DividerProps extends CommonViewModifierProps {}

const DividerNativeView: React.ComponentType<DividerProps> = requireNativeLayoutView(
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
