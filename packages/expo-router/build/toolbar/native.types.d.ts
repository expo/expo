import type { ImageRef } from 'expo-image';
import type { ColorValue } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';
import type { BasicTextStyle } from '../utils/font';
export interface RouterToolbarHostProps {
    children?: React.ReactNode | undefined;
}
export interface RouterToolbarItemProps {
    children?: React.ReactNode | undefined;
    identifier: string;
    title?: string | undefined;
    systemImageName?: SFSymbol | undefined;
    xcassetName?: string | undefined;
    image?: ImageRef | null | undefined;
    imageRenderingMode?: 'template' | 'original' | undefined;
    type?: 'normal' | 'fixedSpacer' | 'fluidSpacer' | 'searchBar' | undefined;
    tintColor?: ColorValue | undefined;
    hidesSharedBackground?: boolean | undefined;
    sharesBackground?: boolean | undefined;
    barButtonItemStyle?: 'plain' | 'prominent' | undefined;
    width?: number | undefined;
    hidden?: boolean | undefined;
    selected?: boolean | undefined;
    possibleTitles?: string[] | undefined;
    badgeConfiguration?: ({
        value?: string;
        backgroundColor?: ColorValue;
    } & BasicTextStyle) | undefined;
    titleStyle?: BasicTextStyle | undefined;
    accessibilityLabel?: string | undefined;
    accessibilityHint?: string | undefined;
    disabled?: boolean | undefined;
    onSelected?: (() => void) | undefined;
}
//# sourceMappingURL=native.types.d.ts.map