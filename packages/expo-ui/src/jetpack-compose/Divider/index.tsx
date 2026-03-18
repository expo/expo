import { requireNativeView } from 'expo';
import { type ColorValue } from 'react-native';

import { type ModifierConfig } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';

export type DividerCommonConfig = {
  /**
   * Thickness of the divider line in dp.
   * Use `StyleSheet.hairlineWidth` for a single-pixel line regardless of density.
   * @default DividerDefaults.Thickness
   */
  thickness?: number;
  /**
   * Color of the divider line.
   * @default DividerDefaults.color
   */
  color?: ColorValue;
  /**
   * Modifiers for the component.
   */
  modifiers?: ModifierConfig[];
};

function transformProps<T extends { modifiers?: ModifierConfig[] }>(props: T): T {
  const { modifiers, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
  } as T;
}

function createDividerComponent<P extends { modifiers?: ModifierConfig[] }>(
  viewName: string
): React.ComponentType<P> {
  const NativeView: React.ComponentType<P> = requireNativeView('ExpoUI', viewName);
  return function DividerComponent(props: P) {
    return <NativeView {...transformProps(props)} />;
  };
}

// region HorizontalDivider

export type HorizontalDividerProps = DividerCommonConfig;

/**
 * A horizontal divider line that groups content in lists and layouts,
 * matching Compose's `HorizontalDivider`.
 */
export const HorizontalDivider =
  createDividerComponent<HorizontalDividerProps>('HorizontalDividerView');

// endregion

// region VerticalDivider

export type VerticalDividerProps = DividerCommonConfig;

/**
 * A vertical divider line that groups content in layouts,
 * matching Compose's `VerticalDivider`.
 */
export const VerticalDivider = createDividerComponent<VerticalDividerProps>('VerticalDividerView');

// endregion
