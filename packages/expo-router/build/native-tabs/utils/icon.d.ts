import type { ColorValue, ImageSourcePropType } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';
import type { IconRenderingMode, NativeTabOptions, NativeTabsProps } from '../types';
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
    renderingMode?: IconRenderingMode;
};
export declare function useAwaitedScreensIcon(icon: NativeTabOptions['icon']): {
    sf?: SFSymbol;
    xcasset?: string;
    drawable?: string;
} | {
    src?: ImageSourcePropType;
    renderingMode?: IconRenderingMode;
} | undefined;
export declare function convertComponentSrcToImageSource(src: React.ReactElement, renderingMode?: IconRenderingMode): {
    src?: ImageSourcePropType | Promise<ImageSourcePropType | null>;
    renderingMode?: IconRenderingMode;
} | undefined;
//# sourceMappingURL=icon.d.ts.map