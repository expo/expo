import type { ColorValue, ImageSourcePropType } from 'react-native';
import type { PlatformIconIOS } from 'react-native-screens';

import type { NativeTabsTriggerIconProps } from '../common/elements';
import type { IconRenderingMode, NativeTabOptions } from '../types';
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
  renderingMode?: IconRenderingMode
): PlatformIconIOS | undefined {
  if (icon && 'sf' in icon && icon.sf) {
    return {
      type: 'sfSymbol',
      name: icon.sf,
    };
  }
  const imageSource = getIconImageSource(icon);
  if (!imageSource) {
    return undefined;
  }
  const effectiveRenderingMode = renderingMode ?? resolveIconRenderingMode(icon);
  if (effectiveRenderingMode === 'original') {
    return { type: 'imageSource', imageSource };
  }
  return { type: 'templateSource', templateSource: imageSource };
}

function getIconImageSource(icon: AwaitedIcon | undefined): ImageSourcePropType | undefined {
  if (!icon || ('sf' in icon && icon.sf)) {
    return undefined;
  }
  if ('xcasset' in icon && icon.xcasset) {
    return { uri: icon.xcasset };
  }
  if ('src' in icon && icon.src) {
    return icon.src;
  }
  return undefined;
}
