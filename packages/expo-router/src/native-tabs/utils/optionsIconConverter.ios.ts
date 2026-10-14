import type { ColorValue, ImageSourcePropType } from 'react-native';
import type { TabsScreenIconIOS } from 'react-native-screens';

import type { NativeTabsTriggerIconProps } from '../common/elements';
import type { IconRenderingMode, NativeTabOptions } from '../types';
import type { AwaitedIcon } from './icon';
import {
  applyIconSrcOptions,
  applyIconStates,
  applySelectedColor,
} from './optionsIconConverter.shared';

// SF Symbols name their single-color rendering `monochrome` rather than `template`.
const SF_SYMBOL_RENDERING_MODES = { template: 'monochrome', original: 'original' } as const;

export function appendIconOptions(options: NativeTabOptions, props: NativeTabsTriggerIconProps) {
  const modes = { renderingMode: 'renderingMode' in props ? props.renderingMode : undefined };
  if ('sf' in props && props.sf) {
    applyIconStates(options, props.sf, (sf) => ({ sf }), modes);
  } else if ('xcasset' in props && props.xcasset) {
    if (process.env.NODE_ENV !== 'production' && modes.renderingMode !== undefined) {
      console.warn(
        '`renderingMode` has no effect on `xcasset` icons — tinting is controlled by the ' +
          'asset\'s "Render As" setting in the asset catalog instead. Remove `renderingMode`, ' +
          'or use `src` if you need to control tinting from JavaScript.'
      );
    }
    applyIconStates(options, props.xcasset, (xcasset) => ({ xcasset }), {});
  } else if ('src' in props && props.src) {
    applyIconSrcOptions(options, props, modes);
  }
  applySelectedColor(options, props.selectedColor);
}

export function resolveIconRenderingMode(
  icon: AwaitedIcon | undefined,
  iconColor?: ColorValue
): IconRenderingMode | undefined {
  if (!getIconImageSource(icon)) {
    return undefined;
  }
  const renderingMode = icon && 'renderingMode' in icon ? icon.renderingMode : undefined;
  return renderingMode ?? (iconColor !== undefined ? 'template' : 'original');
}

export function convertOptionsIconToScreensPropsIcon(
  icon: AwaitedIcon | undefined,
  iconColor?: ColorValue
): TabsScreenIconIOS | undefined {
  if (icon && 'sf' in icon && icon.sf) {
    return {
      type: 'sfSymbol',
      name: icon.sf,
      ...(icon.renderingMode && { renderingMode: SF_SYMBOL_RENDERING_MODES[icon.renderingMode] }),
    };
  }
  // Asset catalog icons have to be resolved natively with `[UIImage imageNamed:]`.
  // Passing the name to the image loader as a `{ uri }` source happens to work for
  // image sets, but symbol sets can never be produced that way. Tinting is then
  // controlled by the asset's "Render As" setting in the asset catalog, not `renderingMode`.
  if (icon && 'xcasset' in icon && icon.xcasset) {
    return {
      type: 'xcasset',
      name: icon.xcasset,
    };
  }
  const imageSource = getIconImageSource(icon);
  if (!imageSource) {
    return undefined;
  }
  return {
    type: 'imageSource',
    imageSource,
    renderingMode: resolveIconRenderingMode(icon, iconColor),
  };
}

// Mirrors the precedence in `convertOptionsIconToScreensPropsIcon` — SF Symbols and asset
// catalog icons get no color-based default rendering mode, so both resolve to `undefined` here.
function getIconImageSource(icon: AwaitedIcon | undefined): ImageSourcePropType | undefined {
  if (!icon || ('sf' in icon && icon.sf) || ('xcasset' in icon && icon.xcasset)) {
    return undefined;
  }
  if ('src' in icon && icon.src) {
    return icon.src;
  }
  return undefined;
}
