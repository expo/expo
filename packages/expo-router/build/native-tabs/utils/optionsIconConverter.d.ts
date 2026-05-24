/**
 * TypeScript / non-native fallback. The real per-platform implementations live
 * in `optionsIconConverter.ios.ts` and `optionsIconConverter.android.ts`, which
 * Metro resolves at runtime via platform extensions.
 */
import type { ColorValue } from 'react-native';
import type { PlatformIconAndroid, PlatformIconIOS } from 'react-native-screens';
import type { AwaitedIcon } from './icon';
import type { NativeTabsTriggerIconProps } from '../common/elements';
import type { NativeTabOptions } from '../types';
export declare function appendIconOptions(options: NativeTabOptions, props: NativeTabsTriggerIconProps): void;
export declare function convertOptionsIconToScreensPropsIcon(_icon: AwaitedIcon | undefined, _iconColor?: ColorValue): PlatformIconIOS | PlatformIconAndroid | undefined;
//# sourceMappingURL=optionsIconConverter.d.ts.map