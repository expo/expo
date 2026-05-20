import type { ColorValue, ImageSourcePropType } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';
import type { NativeTabOptions, NativeTabsProps } from '../types';
export declare function convertIconColorPropToObject(iconColor: NativeTabsProps['iconColor']): {
    default?: ColorValue;
    selected?: ColorValue;
};
export type AwaitedIcon = {
    sf?: SFSymbol;
    xcasset?: string;
    drawable?: string;
} | {
    src?: ImageSourcePropType;
    renderingMode?: 'template' | 'original';
};
export declare function useAwaitedScreensIcon(icon: NativeTabOptions['icon']): {
    sf?: SFSymbol;
    xcasset?: string;
    drawable?: string;
} | {
    src?: ImageSourcePropType;
    renderingMode?: "template" | "original";
} | undefined;
export declare function convertComponentSrcToImageSource(src: React.ReactElement, renderingMode?: 'template' | 'original'): {
    src?: ImageSourcePropType | Promise<ImageSourcePropType | null>;
    renderingMode?: "template" | "original";
} | undefined;
//# sourceMappingURL=icon.d.ts.map