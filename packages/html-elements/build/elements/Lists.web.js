import { forwardRef } from 'react';
import { createElement, StyleSheet } from 'react-native';
export const Ul = forwardRef((props, ref) => {
    return createElement('ul', { ...props, style: [{ listStyleType: 'initial' }, props.style], ref });
});
export const Ol = forwardRef((props, ref) => {
    return createElement('ol', { ...props, style: [props.style], ref });
});
export const Li = forwardRef((props, ref) => {
    return createElement('li', {
        ...props,
        style: [styles.reset, { listStyleType: 'inherit' }, props.style],
        ref,
    });
});
const styles = StyleSheet.create({
    reset: {
        fontFamily: 'System',
    },
});
//# sourceMappingURL=Lists.web.js.map