import type { PlatformIconAndroid } from 'react-native-screens';

import type { AwaitedIcon } from './icon';
import { convertMaterialIconNameToImageSource } from './materialIconConverter';
import { applyIconSrcOptions, applySelectedColor } from './optionsIconConverter.shared';
import type { NativeTabsTriggerIconProps } from '../common/elements';
import type { NativeTabOptions } from '../types';

export function appendIconOptions(options: NativeTabOptions, props: NativeTabsTriggerIconProps) {
  if ('drawable' in props && props.drawable) {
    if ('md' in props) {
      console.warn(
        'Both `md` and `drawable` props are provided to NativeTabs.Trigger.Icon. `drawable` will take precedence on Android platform.'
      );
    }
    options.icon = { drawable: props.drawable };
    options.selectedIcon = undefined;
  } else if ('md' in props && props.md) {
    if (process.env.NODE_ENV !== 'production') {
      if ('drawable' in props) {
        console.warn(
          'Both `md` and `drawable` props are provided to NativeTabs.Trigger.Icon. `drawable` will take precedence on Android platform.'
        );
      }
    }
    options.icon = convertMaterialIconNameToImageSource(props.md);
  } else if ('src' in props && props.src) {
    applyIconSrcOptions(options, props);
  }
  applySelectedColor(options, props.selectedColor);
}

export function convertOptionsIconToScreensPropsIcon(
  icon: AwaitedIcon | undefined
): PlatformIconAndroid | undefined {
  if (icon && 'drawable' in icon && icon.drawable) {
    return {
      type: 'drawableResource',
      name: icon.drawable,
    };
  }
  if (icon && 'src' in icon && icon.src) {
    return { type: 'imageSource', imageSource: icon.src };
  }
  return undefined;
}
