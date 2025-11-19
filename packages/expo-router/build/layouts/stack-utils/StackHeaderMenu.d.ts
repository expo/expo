import type { NativeStackHeaderItemMenu, NativeStackHeaderItemMenuAction } from '@react-navigation/native-stack';
import { type ReactNode } from 'react';
import type { ImageSourcePropType } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';
import { type StackHeaderItemSharedProps } from './shared';
export interface StackHeaderMenuProps extends StackHeaderItemSharedProps {
    changesSelectionAsPrimaryAction?: boolean;
    /**
     * Optional title to show on top of the menu.
     */
    title?: string;
}
export declare const StackHeaderMenu: React.FC<StackHeaderMenuProps>;
export declare function convertStackHeaderMenuPropsToRNHeaderItem(props: StackHeaderMenuProps): NativeStackHeaderItemMenu;
export interface StackHeaderMenuActionProps {
    /**
     * Can be an Icon or Label
     */
    children?: ReactNode;
    /**
     * If `true`, the menu item will be disabled and not selectable.
     *
     * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uimenuelement/attributes/disabled) for more information.
     */
    disabled?: boolean;
    icon?: SFSymbol | ImageSourcePropType;
    /**
     * If `true`, the menu item will be displayed as destructive.
     *
     * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uimenuelement/attributes/destructive) for more information.
     */
    destructive?: boolean;
    /**
     * If `true`, the menu will be kept presented after the action is selected.
     *
     * This is marked as unstable, because when action is selected it will recreate the menu,
     * which will close all opened submenus and reset the scroll position.
     *
     * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uimenuelement/attributes/keepsmenupresented) for more information.
     */
    unstable_keepPresented?: boolean;
    /**
     * If `true`, the menu item will be displayed as selected.
     */
    isOn?: boolean;
    onPress?: () => void;
    /**
     * An elaborated title that explains the purpose of the action.
     */
    discoverabilityLabel?: string;
    hidden?: boolean;
}
export declare const StackHeaderMenuAction: React.FC<StackHeaderMenuActionProps>;
export declare function convertStackHeaderMenuActionPropsToRNHeaderItem(props: StackHeaderMenuActionProps): NativeStackHeaderItemMenuAction;
//# sourceMappingURL=StackHeaderMenu.d.ts.map