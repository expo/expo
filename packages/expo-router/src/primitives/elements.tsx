import type { BadgeProps, IconProps, LabelProps, VectorIconProps } from './types';

export function Badge(props: BadgeProps) {
  return null;
}

export function Icon(props: IconProps) {
  return null;
}

/**
 * Helper component which can be used to load vector icons.
 *
 * @example
 * ```tsx
 * import { Icon, VectorIcon } from 'expo-router';
 * import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
 *
 * <Icon src={<VectorIcon family={MaterialCommunityIcons} name="home" />} />
 *
 * ```
 */
export function VectorIcon<const NameT extends string>(props: VectorIconProps<NameT>) {
  return null;
}

export function Label(props: LabelProps) {
  return null;
}
