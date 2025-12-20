import { requireNativeView } from 'expo';

import { ExpoModifier } from '../../types';

export type DividerProps = {
  /**
   * Modifiers for the component.
   */
  modifiers?: ExpoModifier[];
};

const DividerNativeView: React.ComponentType<DividerProps> = requireNativeView(
  'ExpoUI',
  'DividerView'
);

/**
 * A visual element that can be used to separate other content.
 */
export function Divider(props: DividerProps) {
  return <DividerNativeView {...props} />;
}
