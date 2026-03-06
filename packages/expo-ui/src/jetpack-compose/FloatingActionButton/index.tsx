import { requireNativeView } from 'expo';
import { type ImageSourcePropType, type ImageResolvedAssetSource, Image } from 'react-native';

import { ExpoModifier, ViewEvent } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';

/**
 * The size of the FloatingActionButton. Only applicable when `label` is not set.
 * - `'small'` - Renders a `SmallFloatingActionButton`.
 * - `'medium'` - Renders a standard `FloatingActionButton`.
 * - `'large'` - Renders a `LargeFloatingActionButton`.
 */
export type FloatingActionButtonSize = 'small' | 'medium' | 'large';

/**
 * The color variant of the FloatingActionButton, following Material Design 3 container color roles.
 * - `'surface'` - Uses the surface container color.
 * - `'primary'` - Uses the primary container color.
 * - `'secondary'` - Uses the secondary container color.
 * - `'tertiary'` - Uses the tertiary container color.
 */
export type FloatingActionButtonVariant = 'surface' | 'primary' | 'secondary' | 'tertiary';

export type FloatingActionButtonProps = {
  /**
   * The icon to display. Accepts an `ImageSourcePropType` (e.g., `require('./icon.xml')`).
   * On Android, supports XML vector drawables loaded via Metro bundler.
   */
  icon: ImageSourcePropType;

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
   * The color variant following Material Design 3 container color roles.
   * @default 'primary'
   */
  variant?: FloatingActionButtonVariant;

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
export type NativeFloatingActionButtonProps = Omit<FloatingActionButtonProps, 'icon' | 'onPress'> & {
  icon: ImageResolvedAssetSource;
} & ViewEvent<'onPress', void>;

const FloatingActionButtonNativeView: React.ComponentType<NativeFloatingActionButtonProps> =
  requireNativeView('ExpoUI', 'FloatingActionButtonView');

function transformFloatingActionButtonProps(
  props: FloatingActionButtonProps
): NativeFloatingActionButtonProps {
  const { icon, onPress, modifiers, ...restProps } = props;

  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
    icon: Image.resolveAssetSource(icon),
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
 * import { FloatingActionButton } from '@expo/ui/jetpack-compose';
 *
 * <FloatingActionButton
 *   icon={require('./assets/add.xml')}
 *   onPress={() => console.log('pressed')}
 * />
 * ```
 *
 * @example
 * Extended FAB with label:
 * ```tsx
 * <FloatingActionButton
 *   icon={require('./assets/add.xml')}
 *   label="New Item"
 *   expanded={true}
 *   variant="primary"
 *   onPress={() => console.log('pressed')}
 * />
 * ```
 */
export function FloatingActionButton(props: FloatingActionButtonProps) {
  return <FloatingActionButtonNativeView {...transformFloatingActionButtonProps(props)} />;
}
