import type { NativeTabsLabelStyle, NativeTabsProps } from '../types';

export function convertLabelStylePropToObject(labelStyle: NativeTabsProps['labelStyle']): {
  default?: NativeTabsLabelStyle;
  selected?: NativeTabsLabelStyle;
} {
  if (labelStyle) {
    if (typeof labelStyle === 'object' && ('default' in labelStyle || 'selected' in labelStyle)) {
      return labelStyle;
    }
    return {
      default: labelStyle as NativeTabsLabelStyle,
    };
  }
  return {};
}
