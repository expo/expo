import type { ColorValue, ImageSourcePropType } from 'react-native';
import type { StackToolbarBadgeProps, StackToolbarIconProps, StackToolbarLabelProps, StackToolbarMenuActionProps, StackToolbarMenuProps } from '../layouts/stack-utils';
import type { LinkMenuActionProps, LinkMenuProps } from '../link/elements';
import type { NativeTabsTriggerBadgeProps, NativeTabsTriggerIconProps, NativeTabsTriggerLabelProps } from '../native-tabs';
export type BadgeProps = NativeTabsTriggerBadgeProps | StackToolbarBadgeProps;
export type IconProps = NativeTabsTriggerIconProps | StackToolbarIconProps;
export interface VectorIconProps<NameT extends string> {
    /**
     * The family of the vector icon.
     *
     * @example
     * ```tsx
     * import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
     * ```
     *
     * @hideType
     */
    family: {
        getImageSource: (name: NameT, size: number, color: ColorValue) => Promise<ImageSourcePropType | null>;
    };
    /**
     * The name of the vector icon.
     */
    name: NameT;
}
export type LabelProps = NativeTabsTriggerLabelProps | StackToolbarLabelProps;
export type MenuActionProps = LinkMenuActionProps | StackToolbarMenuActionProps;
export type MenuProps = LinkMenuProps | StackToolbarMenuProps;
//# sourceMappingURL=types.d.ts.map