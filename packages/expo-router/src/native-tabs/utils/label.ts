import { StyleSheet, type StyleProp } from 'react-native';

import type { NativeTabsLabelStyle, NativeTabsProps } from '../types';

export function convertLabelStylePropToObject(labelStyle: NativeTabsProps['labelStyle']): {
  default?: NativeTabsLabelStyle;
  selected?: NativeTabsLabelStyle;
} {
  if (labelStyle) {
    if (typeof labelStyle === 'object' && ('default' in labelStyle || 'selected' in labelStyle)) {
      return {
        default: labelStyle.default ? StyleSheet.flatten(labelStyle.default) : undefined,
        selected: labelStyle.selected ? StyleSheet.flatten(labelStyle.selected) : undefined,
      };
    }
    return {
      default: StyleSheet.flatten(labelStyle as StyleProp<NativeTabsLabelStyle>),
    };
  }
  return {};
}
