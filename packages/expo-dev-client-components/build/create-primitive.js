import * as React from 'react';
import { StyleSheet } from 'react-native';
import { useTheme } from './useExpoTheme';
export function create(component, config) {
    config.selectors = config.selectors || {};
    const Component = React.forwardRef((props, ref) => {
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
function stylesForVariants(props, variants = {}) {
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
function stylesForSelectors(props, selectors = {}, state = {}) {
    const styles = [];
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
//# sourceMappingURL=create-primitive.js.map