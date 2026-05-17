import type { ColorValue, ImageSourcePropType } from 'react-native';
import type { PlatformIconIOS } from 'react-native-screens';

import type { AwaitedIcon } from './icon';
import { applyIconSrcOptions, applySelectedColor } from './optionsIconConverter.shared';
import type { NativeTabsTriggerIconProps } from '../common/elements';
import type { NativeTabOptions } from '../types';

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
  if (icon && (('xcasset' in icon && icon.xcasset) || ('src' in icon && icon.src))) {
    const imageSource =
      'xcasset' in icon && icon.xcasset
        ? { uri: icon.xcasset }
        : (icon as { src: ImageSourcePropType }).src;
    const renderingMode = 'renderingMode' in icon ? icon.renderingMode : undefined;
    const effectiveRenderingMode =
      renderingMode ?? (iconColor !== undefined ? 'template' : 'original');
    if (effectiveRenderingMode === 'original') {
      return { type: 'imageSource', imageSource };
    }
    return { type: 'templateSource', templateSource: imageSource };
  }
  return undefined;
}
