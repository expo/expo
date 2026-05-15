import { requireNativeView } from 'expo';
import { type ColorValue } from 'react-native';

import { type ModifierConfig } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';

export type BadgeProps = {
  /**
   * Background color of the badge.
   * @default BadgeDefaults.containerColor
   */
  containerColor?: ColorValue;
  /**
   * Content color inside the badge (text/icon tint).
   * @default BadgeDefaults.contentColor
   */
  contentColor?: ColorValue;
  /**
   * Modifiers for the component.
   */
  modifiers?: ModifierConfig[];
  /**
   * Optional content inside the badge (for example, a `Text` with a count).
   * When omitted, renders as a small indicator dot.
   */
  children?: React.ReactNode;
};

const BadgeNativeView: React.ComponentType<BadgeProps> = requireNativeView('ExpoUI', 'BadgeView');

function transformProps(props: BadgeProps): BadgeProps {
  const { modifiers, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
  };
}

/**
 * A badge component matching Compose's `Badge`.
 * Renders as a small colored indicator dot, or with content (for example, a count).
 *
 * @see [Jetpack Compose Badge](https://developer.android.com/develop/ui/compose/components/badges)
 */
export function Badge(props: BadgeProps) {
  const { children, ...restProps } = props;
  return <BadgeNativeView {...transformProps(restProps)}>{children}</BadgeNativeView>;
}
