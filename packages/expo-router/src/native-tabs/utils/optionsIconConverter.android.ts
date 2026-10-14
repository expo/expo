import type { TabsScreenIconAndroid } from 'react-native-screens';

import type { NativeTabsTriggerIconProps } from '../common/elements';
import type { NativeTabOptions } from '../types';
import type { AwaitedIcon } from './icon';
import { convertMaterialIconNameToImageSource } from './materialIconConverter';
import {
  applyIconSrcOptions,
  applyIconStates,
  applySelectedColor,
} from './optionsIconConverter.shared';

export function appendIconOptions(options: NativeTabOptions, props: NativeTabsTriggerIconProps) {
  const modes = { tinting: props.tinting };
  if ('drawable' in props && props.drawable) {
    if ('md' in props) {
      console.warn(
        'Both `md` and `drawable` props are provided to NativeTabs.Trigger.Icon. `drawable` will take precedence on Android platform.'
      );
    }
    applyIconStates(options, props.drawable, (drawable) => ({ drawable }), modes);
  } else if ('md' in props && props.md) {
    if (process.env.NODE_ENV !== 'production') {
      if ('drawable' in props) {
        console.warn(
          'Both `md` and `drawable` props are provided to NativeTabs.Trigger.Icon. `drawable` will take precedence on Android platform.'
        );
      }
    }
    applyIconStates(options, props.md, convertMaterialIconNameToImageSource, modes);
  } else if ('src' in props && props.src) {
    applyIconSrcOptions(options, props, modes);
  }
  applySelectedColor(options, props.selectedColor);
}

export function convertOptionsIconToScreensPropsIcon(
  icon: AwaitedIcon | undefined
): TabsScreenIconAndroid | undefined {
  if (icon && 'drawable' in icon && icon.drawable) {
    return {
      type: 'drawableResource',
      name: icon.drawable,
      tinting: icon.tinting,
    };
  }
  if (icon && 'src' in icon && icon.src) {
    return { type: 'imageSource', imageSource: icon.src, tinting: icon.tinting };
  }
  return undefined;
}
