import { requireNativeView } from 'expo';
import { type ColorValue } from 'react-native';

import { type ModifierConfig } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';

export type BadgeProps = {
  /**
   * Text to display inside the badge (e.g., a count).
   * Preferred over children — renders as native Compose Text with correct
   * Badge typography (LabelSmall), ensuring proper 16dp circle sizing for
   * single digits per the M3 spec.
   *
   * When both `text` and `children` are provided, `text` takes precedence.
   * When neither is provided, renders as a small indicator dot.
   */
  text?: string;
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
   * Optional content inside the badge.
   * For text content, prefer the `text` prop for correct M3 typography sizing.
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
 * Renders as a small colored indicator dot, or with content (e.g., a count).
 *
 * @see [Jetpack Compose Badge](https://developer.android.com/develop/ui/compose/components/badges)
 */
export function Badge(props: BadgeProps) {
  const { children, ...restProps } = props;
  return <BadgeNativeView {...transformProps(restProps)}>{children}</BadgeNativeView>;
}
