import { forwardRef } from 'react';
import { createElement, StyleSheet } from 'react-native';
export const Footer = forwardRef((props, ref) => {
    return createElement('footer', { ...props, style: [styles.footer, props.style], ref });
});
export const Nav = forwardRef((props, ref) => {
    return createElement('nav', { ...props, style: [styles.nav, props.style], ref });
});
const styles = StyleSheet.create({
    footer: {
        display: 'flex',
        flexDirection: 'column',
    },
    nav: {
        display: 'flex',
        flexDirection: 'column',
    },
});
//# sourceMappingURL=Layout.web.js.map