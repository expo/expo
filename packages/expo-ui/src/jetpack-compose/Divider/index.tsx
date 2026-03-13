import { requireNativeView } from 'expo';

import { ExpoModifier } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';

export type DividerProps = {
  /**
   * Modifiers for the component.
   */
  modifiers?: ExpoModifier[];
};

type NativeDividerProps = DividerProps;
const DividerNativeView: React.ComponentType<NativeDividerProps> = requireNativeView(
  'ExpoUI',
  'DividerView'
);

function transformProps(props: DividerProps): NativeDividerProps {
  const { modifiers, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
  };
}

/**
 * A visual element that can be used to separate other content.
 */
export function Divider(props: DividerProps) {
  return <DividerNativeView {...transformProps(props)} />;
}
