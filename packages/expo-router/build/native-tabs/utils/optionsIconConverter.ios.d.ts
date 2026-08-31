import type { ColorValue } from 'react-native';
import type { PlatformIconIOS } from 'react-native-screens';
import type { AwaitedIcon } from './icon';
import type { NativeTabsTriggerIconProps } from '../common/elements';
import type { IconRenderingMode, NativeTabOptions } from '../types';
export declare function appendIconOptions(options: NativeTabOptions, props: NativeTabsTriggerIconProps): void;
export declare function resolveIconRenderingMode(icon: AwaitedIcon | undefined, iconColor?: ColorValue): IconRenderingMode | undefined;
export declare function convertOptionsIconToScreensPropsIcon(icon: AwaitedIcon | undefined, renderingMode?: IconRenderingMode): PlatformIconIOS | undefined;
//# sourceMappingURL=optionsIconConverter.ios.d.ts.map