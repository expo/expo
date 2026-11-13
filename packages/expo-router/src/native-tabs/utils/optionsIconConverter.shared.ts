import { isValidElement, type ReactElement } from 'react';
import type { ImageSourcePropType } from 'react-native';
import type { TabsScreenIconAndroid, TabsScreenIconIOS } from 'react-native-screens';

import type { NativeTabsTriggerIconProps } from '../common/elements';
import type { IconRenderingMode, NativeTabOptions, SymbolOrImageSource } from '../types';
import { convertComponentSrcToImageSource } from './icon';

export type ScreensPropsIcon =
  | { platform: 'ios'; icon: TabsScreenIconIOS }
  | { platform: 'android'; icon: TabsScreenIconAndroid };

type PerState<T> = T | { default?: T; selected: T };

export function applyIconSrcOptions(
  options: NativeTabOptions,
  src: PerState<ImageSourcePropType | ReactElement>,
  renderingMode: NativeTabsTriggerIconProps['renderingMode']
) {
  applyIconStates(options, src, convertSrcOrComponentToSrc, renderingMode);
}

/**
 * Sets `icon` and `selectedIcon` from a prop that holds one value or `{ default, selected }`,
 * and adds the rendering mode of each state.
 */
export function applyIconStates<T>(
  options: NativeTabOptions,
  value: PerState<T>,
  toIcon: (value: T) => SymbolOrImageSource | undefined,
  renderingMode: PerState<IconRenderingMode> | undefined
) {
  const icons = getStates(value);
  const modes = getStates(renderingMode);
  const defaultIcon = icons.default ? toIcon(icons.default) : undefined;
  // A mode set only for the selected state needs a selected icon. Reuse the converted default
  // icon, because a second conversion loads a vector icon twice.
  const selectedIcon = icons.selected
    ? toIcon(icons.selected)
    : modes.selected
      ? defaultIcon
      : undefined;

  options.icon = withRenderingMode(defaultIcon, modes.default);
  options.selectedIcon = withRenderingMode(selectedIcon, modes.selected ?? modes.default);
}

function withRenderingMode(
  icon: SymbolOrImageSource | undefined,
  renderingMode: IconRenderingMode | undefined
): SymbolOrImageSource | undefined {
  if (icon && renderingMode) {
    return { ...icon, renderingMode };
  }
  return icon;
}

function getStates<T>(value: PerState<T> | undefined): { default?: T; selected?: T } {
  if (value && typeof value === 'object' && 'selected' in value) {
    // Icon values and modes never have a `selected` key, so this is the `{ default, selected }` form.
    return value as { default?: T; selected: T };
  }
  // Not the `{ default, selected }` form, so it is a single value.
  return { default: value as T | undefined };
}

export function applySelectedColor(
  options: NativeTabOptions,
  selectedColor: NativeTabOptions['selectedIconColor']
) {
  if (selectedColor) {
    options.selectedIconColor = selectedColor;
  }
}

function convertSrcOrComponentToSrc(
  src: ImageSourcePropType | ReactElement
): SymbolOrImageSource | undefined {
  if (isValidElement(src)) {
    return convertComponentSrcToImageSource(src);
  }
  return { src };
}
