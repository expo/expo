import type { BadgeProps, IconProps, LabelProps, VectorIconProps } from './types';
export declare function Badge(props: BadgeProps): null;
export declare function Icon(props: IconProps): null;
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
export declare function VectorIcon<const NameT extends string>(props: VectorIconProps<NameT>): null;
export declare function Label(props: LabelProps): null;
//# sourceMappingURL=elements.d.ts.map