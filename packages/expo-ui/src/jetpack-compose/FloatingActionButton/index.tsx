import { requireNativeView } from 'expo';
import { type ColorValue } from 'react-native';

import { ExpoModifier, ViewEvent } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';

/**
 * The size of the `FloatingActionButton`. Only applicable when `label` is not set.
 * - `'small'` - Renders a `SmallFloatingActionButton`.
 * - `'medium'` - Renders a standard `FloatingActionButton`.
 * - `'large'` - Renders a `LargeFloatingActionButton`.
 */
export type FloatingActionButtonSize = 'small' | 'medium' | 'large';

export type FloatingActionButtonProps = {
  /**
   * The icon content to display inside the button. Pass an `Icon` component as a child.
   */
  children?: React.JSX.Element;

  /**
   * Optional text label. When provided, renders an `ExtendedFloatingActionButton`
   * with the label shown next to the icon.
   */
  label?: string;

  /**
   * Controls whether the label is shown (expanded) or hidden (collapsed).
   * Only relevant when `label` is set.
   * @default true
   */
  expanded?: boolean;

  /**
   * The size of the button. Only applicable when `label` is not set.
   * @default 'medium'
   */
  size?: FloatingActionButtonSize;

  /**
   * The background color of the button container.
   * Defaults to `FloatingActionButtonDefaults.containerColor` (primary container).
   */
  containerColor?: ColorValue;

  /**
   * Callback invoked when the button is pressed.
   */
  onPress?: () => void;

  /**
   * Modifiers for the component.
   */
  modifiers?: ExpoModifier[];
};

/**
 * @hidden
 */
export type NativeFloatingActionButtonProps = Omit<FloatingActionButtonProps, 'onPress'> &
  ViewEvent<'onPress', void>;

const FloatingActionButtonNativeView: React.ComponentType<NativeFloatingActionButtonProps> =
  requireNativeView('ExpoUI', 'FloatingActionButtonView');

function transformFloatingActionButtonProps(
  props: FloatingActionButtonProps
): NativeFloatingActionButtonProps {
  const { children, onPress, modifiers, ...restProps } = props;

  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
    children,
    onPress,
  };
}

/**
 * Renders a Material Design 3 Floating Action Button.
 *
 * When `label` is absent, renders a standard `FloatingActionButton` (or `SmallFloatingActionButton`
 * / `LargeFloatingActionButton` depending on `size`).
 * When `label` is present, renders an `ExtendedFloatingActionButton` with animated label expansion.
 *
 * @example
 * Standard FAB:
 * ```tsx
 * import { FloatingActionButton, Icon } from '@expo/ui/jetpack-compose';
 *
 * <FloatingActionButton onPress={() => console.log('pressed')}>
 *   <Icon source={require('./assets/add.xml')} />
 * </FloatingActionButton>
 * ```
 *
 * @example
 * Extended FAB with label:
 * ```tsx
 * <FloatingActionButton
 *   label="New Item"
 *   expanded={true}
 *   onPress={() => console.log('pressed')}>
 *   <Icon source={require('./assets/add.xml')} />
 * </FloatingActionButton>
 * ```
 */
export function FloatingActionButton(props: FloatingActionButtonProps) {
  return <FloatingActionButtonNativeView {...transformFloatingActionButtonProps(props)} />;
}
