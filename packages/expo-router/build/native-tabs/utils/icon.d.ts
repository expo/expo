import type { ColorValue, ImageSourcePropType } from 'react-native';
import type { BottomTabsScreenProps, PlatformIconAndroid, PlatformIconIOS } from 'react-native-screens';
import type { SFSymbol } from 'sf-symbols-typescript';
import type { NativeTabOptions, NativeTabsProps } from '../types';
export declare function convertIconColorPropToObject(iconColor: NativeTabsProps['iconColor']): {
    default?: ColorValue;
    selected?: ColorValue;
};
type AwaitedIcon = {
    sf?: SFSymbol;
    drawable?: string;
} | {
    src?: ImageSourcePropType;
};
export declare function useAwaitedScreensIcon(icon: NativeTabOptions['icon']): {
    sf?: SFSymbol;
    drawable?: string;
} | {
    src?: ImageSourcePropType;
} | undefined;
export declare function convertOptionsIconToRNScreensPropsIcon(icon: AwaitedIcon | undefined): BottomTabsScreenProps['icon'];
export declare function convertOptionsIconToIOSPropsIcon(icon: AwaitedIcon | undefined): PlatformIconIOS | undefined;
export declare function convertOptionsIconToAndroidPropsIcon(icon: AwaitedIcon): PlatformIconAndroid | undefined;
export declare function convertComponentSrcToImageSource(src: React.ReactElement): {
    src: Promise<ImageSourcePropType | null>;
} | undefined;
export {};
//# sourceMappingURL=icon.d.ts.map