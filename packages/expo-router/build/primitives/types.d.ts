import type { ColorValue, ImageSourcePropType } from 'react-native';
import type { LinkMenuActionProps, LinkMenuProps } from '../link/elements';
import type { NativeTabsTriggerBadgeProps, NativeTabsTriggerIconProps, NativeTabsTriggerLabelProps } from '../native-tabs';
export type BadgeProps = NativeTabsTriggerBadgeProps;
export type IconProps = NativeTabsTriggerIconProps;
export interface VectorIconProps<NameT extends string> {
    /**
     * The family of the vector icon.
     *
     * @example
     * ```tsx
     * import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
     * ```
     */
    family: {
        getImageSource: (name: NameT, size: number, color: ColorValue) => Promise<ImageSourcePropType | null>;
    };
    /**
     * The name of the vector icon.
     */
    name: NameT;
}
export type LabelProps = NativeTabsTriggerLabelProps;
export type MenuActionProps = LinkMenuActionProps;
export type MenuProps = LinkMenuProps;
//# sourceMappingURL=types.d.ts.map