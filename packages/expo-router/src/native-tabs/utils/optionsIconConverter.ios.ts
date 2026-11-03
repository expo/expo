import type { ColorValue } from 'react-native';

import type { NativeTabsTriggerIconProps } from '../common/elements';
import type { NativeTabOptions } from '../types';
import type { AwaitedIcon } from './icon';
import {
  applyIconSrcOptions,
  applyIconStates,
  applySelectedColor,
  type ScreensPropsIcon,
} from './optionsIconConverter.shared';

// SF Symbols call the single-color rendering `monochrome`.
const SF_SYMBOL_RENDERING_MODES = { template: 'monochrome', original: 'original' } as const;

export function appendIconOptions(options: NativeTabOptions, props: NativeTabsTriggerIconProps) {
  if ('sf' in props && props.sf) {
    applyIconStates(options, props.sf, (sf) => ({ sf }), props.renderingMode);
  } else if ('xcasset' in props && props.xcasset) {
    if (process.env.NODE_ENV !== 'production' && props.renderingMode !== undefined) {
      console.warn(
        '`renderingMode` has no effect on `xcasset` icons — tinting is controlled by the ' +
          'asset\'s "Render As" setting in the asset catalog instead. Remove `renderingMode`, ' +
          'or use `src` if you need to control tinting from JavaScript.'
      );
    }
    applyIconStates(options, props.xcasset, (xcasset) => ({ xcasset }), undefined);
  } else if ('src' in props && props.src) {
    applyIconSrcOptions(options, props.src, props.renderingMode);
  }
  applySelectedColor(options, props.selectedColor);
}

/**
 * Converts the icon of one tab state. `iconColor` is the icon color of that state. An image
 * without a rendering mode is drawn as a template when the state has an icon color.
 */
export function convertOptionsIconToScreensPropsIcon(
  icon: AwaitedIcon | undefined,
  iconColor?: ColorValue
): Extract<ScreensPropsIcon, { platform: 'ios' }> | undefined {
  if (!icon) {
    return undefined;
  }
  if ('sf' in icon && icon.sf) {
    return {
      platform: 'ios',
      icon: {
        type: 'sfSymbol',
        name: icon.sf,
        ...(icon.renderingMode && { renderingMode: SF_SYMBOL_RENDERING_MODES[icon.renderingMode] }),
      },
    };
  }
  // Asset catalog icons have to be resolved natively with `[UIImage imageNamed:]`.
  // Passing the name to the image loader as a `{ uri }` source happens to work for
  // image sets, but symbol sets can never be produced that way. Tinting is then
  // controlled by the asset's "Render As" setting in the asset catalog, not `renderingMode`.
  if ('xcasset' in icon && icon.xcasset) {
    return { platform: 'ios', icon: { type: 'xcasset', name: icon.xcasset } };
  }
  if ('src' in icon && icon.src) {
    return {
      platform: 'ios',
      icon: {
        type: 'imageSource',
        imageSource: icon.src,
        renderingMode: icon.renderingMode ?? (iconColor !== undefined ? 'template' : 'original'),
      },
    };
  }
  return undefined;
}
