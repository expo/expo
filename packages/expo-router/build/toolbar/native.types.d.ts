import type { ImageRef } from 'expo-image';
import type { ColorValue } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';
import type { BasicTextStyle } from '../utils/font';
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
}
//# sourceMappingURL=native.types.d.ts.map