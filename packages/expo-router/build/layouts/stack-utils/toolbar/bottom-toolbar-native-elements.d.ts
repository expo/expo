import type { ImageRef } from 'expo-image';
import { type ReactNode } from 'react';
import { type ColorValue, type ImageSourcePropType, type StyleProp, type TextStyle } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';
import { LinkMenuAction } from '../../../link/elements';
import type { BasicTextStyle } from '../../../utils/font';
export interface NativeToolbarMenuProps {
    accessibilityLabel?: string;
    accessibilityHint?: string;
    children?: ReactNode;
    subtitle?: string;
    destructive?: boolean;
    disabled?: boolean;
    hidden?: boolean;
    hidesSharedBackground?: boolean;
    icon?: SFSymbol | ImageSourcePropType;
    /**
     * Image to display for the menu item.
     */
    image?: ImageRef;
    inline?: boolean;
    palette?: boolean;
    separateBackground?: boolean;
    style?: StyleProp<TextStyle>;
    title?: string;
    tintColor?: ColorValue;
    variant?: 'plain' | 'done' | 'prominent';
    elementSize?: 'auto' | 'small' | 'medium' | 'large';
}
/**
 * Native toolbar menu component for bottom toolbar.
 * Renders as NativeLinkPreviewAction.
 */
export declare const NativeToolbarMenu: React.FC<NativeToolbarMenuProps>;
/**
 * Native toolbar menu action - reuses LinkMenuAction.
 */
export declare const NativeToolbarMenuAction: typeof LinkMenuAction;
export interface NativeToolbarButtonProps {
    accessibilityLabel?: string;
    accessibilityHint?: string;
    children?: ReactNode;
    disabled?: boolean;
    hidden?: boolean;
    hidesSharedBackground?: boolean;
    icon?: SFSymbol;
    image?: ImageRef;
    onPress?: () => void;
    possibleTitles?: string[];
    selected?: boolean;
    separateBackground?: boolean;
    style?: StyleProp<BasicTextStyle>;
    tintColor?: ColorValue;
    variant?: 'plain' | 'done' | 'prominent';
}
/**
 * Native toolbar button component for bottom toolbar.
 * Renders as RouterToolbarItem.
 */
export declare const NativeToolbarButton: React.FC<NativeToolbarButtonProps>;
export interface NativeToolbarSpacerProps {
    hidden?: boolean;
    hidesSharedBackground?: boolean;
    sharesBackground?: boolean;
    width?: number;
}
/**
 * Native toolbar spacer component for bottom toolbar.
 * Renders as RouterToolbarItem with type 'fixedSpacer' or 'fluidSpacer'.
 */
export declare const NativeToolbarSpacer: React.FC<NativeToolbarSpacerProps>;
export interface NativeToolbarSearchBarSlotProps {
    hidesSharedBackground?: boolean;
    hidden?: boolean;
    sharesBackground?: boolean;
}
/**
 * Native toolbar search bar slot for bottom toolbar (iOS 26+).
 * Renders as RouterToolbarItem with type 'searchBar'.
 */
export declare const NativeToolbarSearchBarSlot: React.FC<NativeToolbarSearchBarSlotProps>;
export interface NativeToolbarViewProps {
    children?: ReactNode;
    hidden?: boolean;
    hidesSharedBackground?: boolean;
    separateBackground?: boolean;
}
/**
 * Native toolbar view component for bottom toolbar.
 * Renders as RouterToolbarItem with children.
 */
export declare const NativeToolbarView: React.FC<NativeToolbarViewProps>;
//# sourceMappingURL=bottom-toolbar-native-elements.d.ts.map