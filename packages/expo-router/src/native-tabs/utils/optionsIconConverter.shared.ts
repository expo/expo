import { isValidElement, type ReactElement } from 'react';
import type { ImageSourcePropType } from 'react-native';

import type { SrcIcon } from '../common/elements';
import type { IconRenderingMode, NativeTabOptions } from '../types';
import { convertComponentSrcToImageSource } from './icon';

export function applyIconSrcOptions(options: NativeTabOptions, props: SrcIcon) {
  const icon = convertIconSrcToIconOption(props);
  options.icon = icon?.icon;
  options.selectedIcon = icon?.selectedIcon;
}

export function applySelectedColor(
  options: NativeTabOptions,
  selectedColor: NativeTabOptions['selectedIconColor']
) {
  if (selectedColor) {
    options.selectedIconColor = selectedColor;
  }
}

function convertIconSrcToIconOption(
  icon: SrcIcon | undefined
): Pick<NativeTabOptions, 'icon' | 'selectedIcon'> | undefined {
  if (icon && icon.src) {
    const { defaultIcon, selected } =
      typeof icon.src === 'object' && 'selected' in icon.src
        ? { defaultIcon: icon.src.default, selected: icon.src.selected }
        : { defaultIcon: icon.src };

    const options: Pick<NativeTabOptions, 'icon' | 'selectedIcon'> = {};
    options.icon = convertSrcOrComponentToSrc(defaultIcon, { renderingMode: icon.renderingMode });
    options.selectedIcon = convertSrcOrComponentToSrc(selected, {
      renderingMode: icon.renderingMode,
    });
    return options;
  }

  return undefined;
}

function convertSrcOrComponentToSrc(
  src: ImageSourcePropType | ReactElement | undefined,
  options: {
    renderingMode: IconRenderingMode | undefined;
  }
) {
  if (src) {
    if (isValidElement(src)) {
      return convertComponentSrcToImageSource(src, options.renderingMode);
    } else {
      return { src, renderingMode: options.renderingMode };
    }
  }
  return undefined;
}
