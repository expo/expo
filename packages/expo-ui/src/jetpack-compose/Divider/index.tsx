import { requireNativeView } from 'expo';
import { type ColorValue } from 'react-native';

import { type ModifierConfig } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';

export type DividerProps = {
  /**
   * Thickness of the divider line in dp.
   * Use `StyleSheet.hairlineWidth` for a single-pixel line regardless of density.
   */
  thickness?: number;
  /**
   * Color of the divider line.
   */
  color?: ColorValue;
  /**
   * Modifiers for the component.
   */
  modifiers?: ModifierConfig[];
};

function transformProps(props: DividerProps): DividerProps {
  const { modifiers, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
  };
}

function createDividerComponent(viewName: string): React.ComponentType<DividerProps> {
  const NativeView: React.ComponentType<DividerProps> = requireNativeView('ExpoUI', viewName);
  return function DividerComponent(props: DividerProps) {
    return <NativeView {...transformProps(props)} />;
  };
}

/**
 * A horizontal divider line that groups content in lists and layouts,
 * matching Compose's `HorizontalDivider`.
 */
export const HorizontalDivider = createDividerComponent('HorizontalDividerView');

/**
 * A vertical divider line that groups content in layouts,
 * matching Compose's `VerticalDivider`.
 */
export const VerticalDivider = createDividerComponent('VerticalDividerView');
