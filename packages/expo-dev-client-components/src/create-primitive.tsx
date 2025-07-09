import { ComponentType, PropsWithChildren, createElement, forwardRef } from 'react';
import { type ImageStyle, StyleSheet, type TextStyle, type ViewStyle } from 'react-native';

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

type SelectorProps = {
  light?: StyleType;
  dark?: StyleType;
};

export function create<T extends object, O extends Options>(
  component: ComponentType<T>,
  config: O & { selectors?: Selectors<O['variants']>; props?: T }
) {
  config.selectors = config.selectors ?? {};
  config.variants = config.variants ?? {};

  return forwardRef<
    T,
    PropsWithChildren<T> & Nested<(typeof config)['variants']> & { selectors?: SelectorProps }
  >((props, ref) => {
    const theme = useTheme();

    const variantFreeProps: any = { ...props };

    const variantStyles = stylesForVariants(props, config.variants);
    const selectorStyles = stylesForSelectors(props, config.selectors, { theme });
    const selectorPropsStyles = stylesForSelectorProps(variantFreeProps.selectors, { theme });

    // @ts-ignore
    // there could be a conflict between the primitive prop and the variant name
    // for example - variant name "width" and prop "width"
    // in these cases, favor the variant because it is under the users control (e.g they can update the conflicting name)
    Object.keys(config.variants).forEach((variant) => {
      delete variantFreeProps[variant];
    });

    return createElement(component, {
      ...config.props,
      ...variantFreeProps,
      style: StyleSheet.flatten([
        config.base,
        variantStyles,
        selectorStyles,
        selectorPropsStyles,
        variantFreeProps.style ?? {},
      ]),
      ref,
    });
  });
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

      if (variants.base != null) {
        styles.push(variants.base);
      }

      styles.push(variantStyles);
    }
  }

  return StyleSheet.flatten(styles);
}

function stylesForSelectorProps(selectors: any = {}, state: any = {}) {
  const styles: any[] = [];

  if (state.theme != null) {
    if (selectors[state.theme] != null) {
      const selectorStyles = selectors[state.theme];
      styles.push(selectorStyles);
    }
  }

  return StyleSheet.flatten(styles);
}
