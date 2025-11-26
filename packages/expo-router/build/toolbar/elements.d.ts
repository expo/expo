import { type StyleProp, type ViewStyle } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';
import type { RouterToolbarHostProps, RouterToolbarItemProps } from './native.types';
import { LinkMenuAction, type LinkMenuActionProps, type LinkMenuProps } from '../link/elements';
export type ToolbarMenuProps = LinkMenuProps;
export declare const ToolbarMenu: import("react").FC<LinkMenuProps>;
export type ToolbarMenuActionProps = LinkMenuActionProps;
export declare const ToolbarMenuAction: typeof LinkMenuAction;
export interface ToolbarButtonProps extends Pick<RouterToolbarItemProps, 'barButtonItemStyle' | 'hidden' | 'selected' | 'possibleTitles' | 'tintColor' | 'hidesSharedBackground' | 'sharesBackground'> {
    children?: string;
    sf?: SFSymbol;
    onPress?: () => void;
}
export declare const ToolbarButton: ({ children, sf, onPress, ...rest }: ToolbarButtonProps) => import("react").JSX.Element;
export type ToolbarSpacerProps = Pick<RouterToolbarItemProps, 'width' | 'hidden'>;
export declare const ToolbarSpacer: ({ width, ...rest }: ToolbarSpacerProps) => import("react").JSX.Element;
export interface ToolbarCustomViewProps extends Pick<RouterToolbarItemProps, 'hidesSharedBackground' | 'sharesBackground'> {
    children: React.ReactNode;
    style?: StyleProp<Omit<ViewStyle, 'position' | 'inset' | 'top' | 'left' | 'right' | 'bottom' | 'flex'>>;
}
export declare const ToolbarCustomView: ({ children, style, ...rest }: ToolbarCustomViewProps) => import("react").JSX.Element;
export type ToolbarHostProps = RouterToolbarHostProps;
export declare const ToolbarHost: (props: ToolbarHostProps) => import("react").JSX.Element;
//# sourceMappingURL=elements.d.ts.map