import type { ImageRef } from 'expo-image';
import type { ColorValue, ImageSourcePropType } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';
import type { BasicTextStyle } from '../utils/font';
export interface RouterToolbarMenuAction {
    label: string;
    onPress?: () => void;
    disabled?: boolean;
    destructive?: boolean;
}
export interface RouterToolbarMenuSubmenu {
    label: string;
    actions: RouterToolbarMenuAction[];
    submenus?: RouterToolbarMenuSubmenu[];
}
export interface RouterToolbarMenuProps {
    source?: ImageSourcePropType;
    mdIconName?: string;
    tintColor?: ColorValue;
    disabled?: boolean;
    hidden?: boolean;
    actions: RouterToolbarMenuAction[];
    submenus?: RouterToolbarMenuSubmenu[];
}
export interface RouterToolbarHostProps {
    children?: React.ReactNode;
}
export interface RouterToolbarItemProps {
    children?: React.ReactNode;
    identifier: string;
    title?: string;
    systemImageName?: SFSymbol;
    xcassetName?: string;
    image?: ImageRef | null;
    imageRenderingMode?: 'template' | 'original';
    type?: 'normal' | 'fixedSpacer' | 'fluidSpacer' | 'searchBar';
    tintColor?: ColorValue;
    hidesSharedBackground?: boolean;
    sharesBackground?: boolean;
    barButtonItemStyle?: 'plain' | 'prominent';
    width?: number;
    hidden?: boolean;
    selected?: boolean;
    possibleTitles?: string[];
    badgeConfiguration?: {
        value?: string;
        backgroundColor?: ColorValue;
    } & BasicTextStyle;
    titleStyle?: BasicTextStyle;
    accessibilityLabel?: string;
    accessibilityHint?: string;
    disabled?: boolean;
    onSelected?: () => void;
    /**
     * Raw image source for Android toolbar rendering.
     * On iOS this prop is ignored — icons are resolved via `systemImageName`, `xcassetName`, or `image`.
     */
    source?: ImageSourcePropType;
    /**
     * Material Design icon name being loaded asynchronously on Android.
     */
    mdIconName?: string;
}
//# sourceMappingURL=native.types.d.ts.map