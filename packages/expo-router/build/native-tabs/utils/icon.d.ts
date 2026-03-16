import type { ColorValue, ImageSourcePropType } from 'react-native';
import type { TabsScreenProps, PlatformIconAndroid, PlatformIconIOS } from 'react-native-screens';
import type { SFSymbol } from 'sf-symbols-typescript';
import type { NativeTabOptions, NativeTabsProps } from '../types';
export declare function convertIconColorPropToObject(iconColor: NativeTabsProps['iconColor']): {
    default?: ColorValue;
    selected?: ColorValue;
};
type AwaitedIcon = {
    sf?: SFSymbol | undefined;
    xcasset?: string | undefined;
    drawable?: string | undefined;
} | {
    src?: ImageSourcePropType | undefined;
    renderingMode?: 'template' | 'original' | undefined;
};
export declare function useAwaitedScreensIcon(icon: NativeTabOptions['icon']): {
    sf?: SFSymbol | undefined;
    xcasset?: string | undefined;
    drawable?: string | undefined;
} | {
    src?: ImageSourcePropType | undefined;
    renderingMode?: "template" | "original" | undefined;
} | undefined;
export declare function convertOptionsIconToRNScreensPropsIcon(icon: AwaitedIcon | undefined, iconColor?: ColorValue): TabsScreenProps['icon'];
export declare function convertOptionsIconToIOSPropsIcon(icon: AwaitedIcon | undefined, iconColor?: ColorValue): PlatformIconIOS | undefined;
export declare function convertOptionsIconToAndroidPropsIcon(icon: AwaitedIcon): PlatformIconAndroid | undefined;
export declare function convertComponentSrcToImageSource(src: React.ReactElement): {
    src: Promise<ImageSourcePropType | null>;
} | undefined;
export {};
//# sourceMappingURL=icon.d.ts.map