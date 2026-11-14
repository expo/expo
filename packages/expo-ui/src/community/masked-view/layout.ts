import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

// Styles that arrange the children, so they belong on the view that holds them.
const CHILD_LAYOUT_STYLES = new Set<string>([
  'flexDirection',
  'flexWrap',
  'justifyContent',
  'alignItems',
  'alignContent',
  'gap',
  'rowGap',
  'columnGap',
  'padding',
  'paddingTop',
  'paddingBottom',
  'paddingLeft',
  'paddingRight',
  'paddingStart',
  'paddingEnd',
  'paddingHorizontal',
  'paddingVertical',
]);

// Any of these can give the view a size, so the view keeps filling it.
const SIZE_STYLES = new Set<string>([
  'width',
  'height',
  'minWidth',
  'minHeight',
  'maxWidth',
  'maxHeight',
  'flex',
  'flexGrow',
  'flexShrink',
  'flexBasis',
  'aspectRatio',
]);

export type MaskedViewLayout = {
  outerStyle: ViewStyle;
  contentStyle: ViewStyle;
  /**
   * Whether the masked view takes its size from its children, like a plain `View`. Only when
   * `style` has nothing that can size it, so styles that worked before keep the fill behavior.
   */
  matchContents: boolean;
};

export function getMaskedViewLayout(style: StyleProp<ViewStyle>): MaskedViewLayout {
  const flat: ViewStyle = StyleSheet.flatten(style) ?? {};
  const matchContents =
    flat.position !== 'absolute' &&
    !Object.keys(flat).some((key) => SIZE_STYLES.has(key) || key.startsWith('inset'));

  const outerStyle: Record<string, unknown> = {};
  const contentStyle: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(flat)) {
    (CHILD_LAYOUT_STYLES.has(key) ? contentStyle : outerStyle)[key] = value;
  }
  return { outerStyle, contentStyle, matchContents };
}
