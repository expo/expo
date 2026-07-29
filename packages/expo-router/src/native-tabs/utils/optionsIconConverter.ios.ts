import type { ColorValue } from 'react-native';
import type { PlatformIconIOS } from 'react-native-screens';

import type { NativeTabsTriggerIconProps } from '../common/elements';
import type { NativeTabOptions } from '../types';
import type { AwaitedIcon } from './icon';
import { applyIconSrcOptions, applySelectedColor } from './optionsIconConverter.shared';

export function appendIconOptions(options: NativeTabOptions, props: NativeTabsTriggerIconProps) {
  if ('sf' in props && props.sf) {
    if (typeof props.sf === 'string') {
      options.icon = props.sf
        ? {
            sf: props.sf,
          }
        : undefined;
      options.selectedIcon = undefined;
    } else if (props.sf) {
      options.icon = props.sf.default
        ? {
            sf: props.sf.default,
          }
        : undefined;
      options.selectedIcon = props.sf.selected
        ? {
            sf: props.sf.selected,
          }
        : undefined;
    }
  } else if ('xcasset' in props && props.xcasset) {
    if (typeof props.xcasset === 'string') {
      options.icon = { xcasset: props.xcasset };
      options.selectedIcon = undefined;
    } else {
      options.icon = props.xcasset.default ? { xcasset: props.xcasset.default } : undefined;
      options.selectedIcon = props.xcasset.selected
        ? { xcasset: props.xcasset.selected }
        : undefined;
    }
  } else if ('src' in props && props.src) {
    applyIconSrcOptions(options, props);
  }
  applySelectedColor(options, props.selectedColor);
}

export function convertOptionsIconToScreensPropsIcon(
  icon: AwaitedIcon | undefined,
  iconColor?: ColorValue
): PlatformIconIOS | undefined {
  if (icon && 'sf' in icon && icon.sf) {
    return {
      type: 'sfSymbol',
      name: icon.sf,
    };
  }
  // Asset catalog icons have to be resolved natively with `[UIImage imageNamed:]`.
  // Passing the name to the image loader as a `{ uri }` source happens to work for
  // image sets, but symbol sets can never be produced that way. Tinting is then
  // controlled by the asset's "Render As" setting in the asset catalog.
  if (icon && 'xcasset' in icon && icon.xcasset) {
    return {
      type: 'xcasset',
      name: icon.xcasset,
    };
  }
  if (icon && 'src' in icon && icon.src) {
    const renderingMode = 'renderingMode' in icon ? icon.renderingMode : undefined;
    const effectiveRenderingMode =
      renderingMode ?? (iconColor !== undefined ? 'template' : 'original');
    if (effectiveRenderingMode === 'original') {
      return { type: 'imageSource', imageSource: icon.src };
    }
    return { type: 'templateSource', templateSource: icon.src };
  }
  return undefined;
}
