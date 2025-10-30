import type { ColorValue, ImageSourcePropType } from 'react-native';
import type { BottomTabsScreenProps } from 'react-native-screens';
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
export declare function getRNScreensAndroidIconResourceFromAwaitedIcon(icon: AwaitedIcon | undefined): BottomTabsScreenProps['iconResource'];
export declare function getRNScreensAndroidIconResourceNameFromAwaitedIcon(icon: AwaitedIcon | undefined): BottomTabsScreenProps['iconResourceName'];
export {};
//# sourceMappingURL=icon.d.ts.map