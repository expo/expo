import { ComponentType } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated from 'react-native-reanimated';

import { defaultCSSInterop } from '../native/css-interop';
import { InteropFunction, polyfillMapping } from './mapping';

export { defaultCSSInterop };

export function makeStyled(component: ComponentType, interop: InteropFunction = defaultCSSInterop) {
  polyfillMapping.set(component, interop);
}

makeStyled(Animated.Text);
makeStyled(Animated.View);
makeStyled(Pressable);
makeStyled(Text);
makeStyled(View);

/**
 * The SvgCSSInterop utilises the defaultCSSInterop to transform the `style` prop.
 * Once transformed, the `fill` and `stroke` style attributes are removed and added to the `props` object
 */
export function svgCSSInterop(
  jsx: Function,
  type: ComponentType<any>,
  props: any,
  key: string,
  experimentalFeatures?: boolean
) {
  function svgInterop(type: ComponentType, { style, ...$props }: Record<string, any>, key: string) {
    if (style.fill !== undefined) {
      $props.fill = style.fill;
      delete style.fill;
    }

    if (style.stroke !== undefined) {
      $props.stroke = style.stroke;
      delete style.stroke;
    }

    return jsx(type, { ...$props, style }, key);
  }

  return defaultCSSInterop(svgInterop, type, props, key, experimentalFeatures);
}
