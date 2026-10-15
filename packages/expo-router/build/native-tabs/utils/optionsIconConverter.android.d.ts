import type { AwaitedIcon } from './icon';
import { type ScreensPropsIcon } from './optionsIconConverter.shared';
import type { NativeTabsTriggerIconProps } from '../common/elements';
import type { NativeTabOptions } from '../types';
export declare function appendIconOptions(options: NativeTabOptions, props: NativeTabsTriggerIconProps): void;
export declare function convertOptionsIconToScreensPropsIcon(icon: AwaitedIcon | undefined): Extract<ScreensPropsIcon, {
    platform: 'android';
}> | undefined;
//# sourceMappingURL=optionsIconConverter.android.d.ts.map