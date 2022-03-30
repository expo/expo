import * as React from 'react';
import { StyleSheet } from 'react-native';
import { useTheme } from './useExpoTheme';
export function create(component, config) {
    config.selectors = config.selectors ?? {};
    config.variants = config.variants ?? {};
    const Component = React.forwardRef((props, ref) => {
        const theme = useTheme();
        const variantStyles = stylesForVariants(props, config.variants);
        const selectorStyles = stylesForSelectors(props, config.selectors, { theme });
        const selectorPropsStyles = stylesForSelectorProps(props.selectors, { theme });
        const variantFreeProps = { ...props };
        // @ts-ignore
        // there could be a conflict between the primitive prop and the variant name
        // for example - variant name "width" and prop "width"
        // in these cases, favor the variant because it is under the users control (e.g they can update the conflicting name)
        Object.keys(config.variants).forEach((variant) => {
            delete variantFreeProps[variant];
        });
        return React.createElement(component, {
            ...config.props,
            ...variantFreeProps,
            style: StyleSheet.flatten([
                config.base,
                variantStyles,
                selectorStyles,
                selectorPropsStyles,
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
            if (variants.base != null) {
                styles.push(variants.base);
            }
            styles.push(variantStyles);
        }
    }
    return StyleSheet.flatten(styles);
}
function stylesForSelectorProps(selectors = {}, state = {}) {
    const styles = [];
    if (state.theme != null) {
        if (selectors[state.theme] != null) {
            const selectorStyles = selectors[state.theme];
            styles.push(selectorStyles);
        }
    }
    return StyleSheet.flatten(styles);
}
//# sourceMappingURL=create-primitive.js.map