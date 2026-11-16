import type { NativeTabsTriggerIconProps } from '../common/elements';
import type { NativeTabOptions } from '../types';
import type { AwaitedIcon } from './icon';
import { convertMaterialIconNameToImageSource } from './materialIconConverter';
import {
  applyIconSrcOptions,
  applyIconStates,
  applySelectedColor,
  type ScreensPropsIcon,
} from './optionsIconConverter.shared';

const TINTINGS = { template: 'tinted', original: 'original' } as const;

export function appendIconOptions(options: NativeTabOptions, props: NativeTabsTriggerIconProps) {
  if ('drawable' in props && props.drawable) {
    if ('md' in props) {
      console.warn(
        'Both `md` and `drawable` props are provided to NativeTabs.Trigger.Icon. `drawable` will take precedence on Android platform.'
      );
    }
    applyIconStates(options, props.drawable, (drawable) => ({ drawable }), props.renderingMode);
  } else if ('md' in props && props.md) {
    if (process.env.NODE_ENV !== 'production') {
      if ('drawable' in props) {
        console.warn(
          'Both `md` and `drawable` props are provided to NativeTabs.Trigger.Icon. `drawable` will take precedence on Android platform.'
        );
      }
    }
    applyIconStates(options, props.md, convertMaterialIconNameToImageSource, props.renderingMode);
  } else if ('src' in props && props.src) {
    applyIconSrcOptions(options, props.src, props.renderingMode);
  }
  applySelectedColor(options, props.selectedColor);
}

// Without `renderingMode`, `tinting` stays unset and the tab bar tints the icon.
export function convertOptionsIconToScreensPropsIcon(
  icon: AwaitedIcon | undefined
): Extract<ScreensPropsIcon, { platform: 'android' }> | undefined {
  if (!icon) {
    return undefined;
  }
  const tinting = icon.renderingMode && { tinting: TINTINGS[icon.renderingMode] };
  if ('drawable' in icon && icon.drawable) {
    return {
      platform: 'android',
      icon: { type: 'drawableResource', name: icon.drawable, ...tinting },
    };
  }
  if ('src' in icon && icon.src) {
    return {
      platform: 'android',
      icon: { type: 'imageSource', imageSource: icon.src, ...tinting },
    };
  }
  return undefined;
}
