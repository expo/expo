import type { BadgeProps, IconProps, LabelProps, VectorIconProps } from './types';

export function Badge(props: BadgeProps) {
  return null;
}

export function Icon(props: IconProps) {
  return null;
}

/**
 * Helper component for loading vector icons.
 *
 * Prefer using the `md` and `sf` props on `Icon` rather than using this component directly.
 * Only use this component when you need to load a specific icon from a vector icon family.
 *
 * @example
 * ```tsx
 * import { Icon, VectorIcon } from 'expo-router';
 * import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
 *
 * <Icon src={<VectorIcon family={MaterialCommunityIcons} name="home" />} />
 * ```
 */
export function VectorIcon<const NameT extends string>(props: VectorIconProps<NameT>) {
  return null;
}

export function Label(props: LabelProps) {
  return null;
}
