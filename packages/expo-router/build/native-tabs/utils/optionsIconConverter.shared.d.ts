import type { PlatformIconAndroid, PlatformIconIOS } from 'react-native-screens';
import type { SrcIcon } from '../common/elements';
import type { NativeTabOptions } from '../types';
export type ScreensPropsIcon = {
    platform: 'ios';
    icon: PlatformIconIOS;
} | {
    platform: 'android';
    icon: PlatformIconAndroid;
};
export declare function applyIconSrcOptions(options: NativeTabOptions, props: SrcIcon): void;
export declare function applySelectedColor(options: NativeTabOptions, selectedColor: NativeTabOptions['selectedIconColor']): void;
//# sourceMappingURL=optionsIconConverter.shared.d.ts.map