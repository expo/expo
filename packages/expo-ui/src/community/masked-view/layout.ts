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

export type MaskedViewLayout = {
  outerStyle: ViewStyle;
  contentStyle: ViewStyle;
  /**
   * Whether the masked view takes its size from its children, like a plain `View`. Only when
   * `style` sizes neither axis: a sized axis can't tell if the other one should stretch.
   */
  matchContents: boolean;
};

export function getMaskedViewLayout(style: StyleProp<ViewStyle>): MaskedViewLayout {
  const flat: ViewStyle = StyleSheet.flatten(style) ?? {};
  const absolute = flat.position === 'absolute';
  const sized =
    (flat.flex ?? 0) > 0 ||
    (flat.flexGrow ?? 0) > 0 ||
    flat.width != null ||
    flat.height != null ||
    (absolute && (flat.left ?? flat.start) != null && (flat.right ?? flat.end) != null) ||
    (absolute && flat.top != null && flat.bottom != null);
  const matchContents = !sized;

  const outerStyle: Record<string, unknown> = {};
  const contentStyle: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(flat)) {
    // A content-sized host is a regular child, so the outer view's padding insets it.
    const isContentStyle =
      CHILD_LAYOUT_STYLES.has(key) && !(matchContents && key.startsWith('padding'));
    (isContentStyle ? contentStyle : outerStyle)[key] = value;
  }
  return { outerStyle, contentStyle, matchContents };
}
