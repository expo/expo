import * as React from 'react';
import { StyleSheet, ViewStyle, ImageStyle, TextStyle } from 'react-native';

import { useTheme } from './useExpoTheme';

type StyleType = ViewStyle | TextStyle | ImageStyle;

type Options = {
  base?: StyleType;
  variants?: VariantMap<StyleType>;
};

type VariantMap<T> = { [key: string]: { [key: string]: T } };

type Nested<Type> = {
  [Property in keyof Type]?: keyof Type[Property];
};

type SelectorMap<Variants> = Partial<{
  [K in keyof Variants]?: {
    [T in keyof Variants[K]]?: StyleType;
  };
}>;

type Selectors<Variants> = {
  light?: SelectorMap<Variants>;
  dark?: SelectorMap<Variants>;
};

export function create<T, O extends Options>(
  component: React.ComponentType<T>,
  config: O & { selectors?: Selectors<O['variants']>; props?: T }
) {
  config.selectors = config.selectors || {};

  const Component = React.forwardRef<
    T,
    React.PropsWithChildren<T> & Nested<typeof config['variants']>
  >((props, ref) => {
    const theme = useTheme();

    const variantStyles = stylesForVariants(props, config.variants);
    const selectorStyles = stylesForSelectors(props, config.selectors, { theme });

    return React.createElement(component, {
      ...props,
      ...config.props,
      style: StyleSheet.flatten([
        config.base,
        variantStyles,
        selectorStyles,
        // @ts-ignore
        props.style || {},
      ]),
      ref,
    });
  });

  return Component;
}

function stylesForVariants(props: any, variants: any = {}) {
  let styles = {};

  for (const key in props) {
    if (variants[key]) {
      const value = props[key];

      const styleValue = variants[key][value];
      if (styleValue) {
        styles = StyleSheet.flatten(StyleSheet.compose(styles, styleValue));
      }
    }
  }

  return styles;
}

function stylesForSelectors(props: any, selectors: any = {}, state: any = {}) {
  const styles: any[] = [];

  if (state.theme != null) {
    if (selectors[state.theme] != null) {
      const variants = selectors[state.theme];
      const variantStyles = stylesForVariants(props, variants);
      styles.push(variantStyles);

      if (variants.base != null) {
        styles.push(variants.base);
      }
    }
  }

  return StyleSheet.flatten(styles);
}
