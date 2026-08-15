import { requireNativeView } from 'expo';
import { type ColorValue } from 'react-native';

import { type ModifierConfig } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';

export type DividerCommonConfig = {
  /**
   * Thickness of the divider line. Accepts dp values; use `StyleSheet.hairlineWidth` for a single-pixel line.
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

function transformProps(props: DividerCommonConfig): DividerCommonConfig {
  const { modifiers, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
  };
}

function createDividerComponent(viewName: string): React.ComponentType<DividerCommonConfig> {
  const NativeView: React.ComponentType<DividerCommonConfig> = requireNativeView(
    'ExpoUI',
    viewName
  );
  function Component(props: DividerCommonConfig) {
    return <NativeView {...transformProps(props)} />;
  }
  Component.displayName = viewName;
  return Component;
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
