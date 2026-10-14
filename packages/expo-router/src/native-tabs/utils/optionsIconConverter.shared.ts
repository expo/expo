import { isValidElement, type ReactElement } from 'react';
import type { ImageSourcePropType } from 'react-native';

import type { SrcIcon } from '../common/elements';
import type {
  IconRenderingMode,
  IconTinting,
  NativeTabOptions,
  SymbolOrImageSource,
} from '../types';
import { convertComponentSrcToImageSource } from './icon';

type PerState<T> = T | { default?: T; selected: T };

interface IconModes {
  renderingMode?: PerState<IconRenderingMode>;
  tinting?: PerState<IconTinting>;
}

export function applyIconSrcOptions(options: NativeTabOptions, props: SrcIcon, modes: IconModes) {
  applyIconStates(options, props.src, convertSrcOrComponentToSrc, modes);
}

/**
 * Sets `icon` and `selectedIcon` from a prop that holds one value or `{ default, selected }`,
 * and adds the rendering mode and tinting of each state.
 */
export function applyIconStates<T>(
  options: NativeTabOptions,
  value: PerState<T> | undefined,
  toIcon: (value: T) => SymbolOrImageSource | undefined,
  modes: IconModes
) {
  const icons = getStates(value);
  const renderingModes = getStates(modes.renderingMode);
  const tintings = getStates(modes.tinting);
  const defaultIcon = icons.default ? toIcon(icons.default) : undefined;
  // A mode set only for the selected state needs its own selected icon, so reuse the converted
  // default one. Converting it again would load a vector icon twice.
  const hasSelectedMode = renderingModes.selected !== undefined || tintings.selected !== undefined;
  const selectedIcon = icons.selected
    ? toIcon(icons.selected)
    : hasSelectedMode
      ? defaultIcon
      : undefined;

  options.icon = withModes(defaultIcon, renderingModes.default, tintings.default);
  options.selectedIcon = withModes(
    selectedIcon,
    renderingModes.selected ?? renderingModes.default,
    tintings.selected ?? tintings.default
  );
}

function withModes(
  icon: SymbolOrImageSource | undefined,
  renderingMode: IconRenderingMode | undefined,
  tinting: IconTinting | undefined
): SymbolOrImageSource | undefined {
  if (!icon) {
    return undefined;
  }
  return { ...icon, ...(renderingMode && { renderingMode }), ...(tinting && { tinting }) };
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
