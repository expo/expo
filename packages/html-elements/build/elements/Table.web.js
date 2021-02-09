import { forwardRef } from 'react';
import { StyleSheet } from 'react-native';
import createElement from 'react-native-web/dist/exports/createElement';
export const Table = forwardRef((props, ref) => {
    return createElement('table', { ...props, style: [styles.reset, props.style], ref });
});
export const THead = forwardRef((props, ref) => {
    return createElement('thead', { ...props, style: [styles.reset, props.style], ref });
});
export const TBody = forwardRef((props, ref) => {
    return createElement('tbody', { ...props, style: [styles.reset, props.style], ref });
});
export const TFoot = forwardRef((props, ref) => {
    return createElement('tfoot', { ...props, style: [styles.reset, props.style], ref });
});
export const TH = forwardRef((props, ref) => {
    return createElement('th', { ...props, style: [styles.reset, props.style], ref });
});
export const TR = forwardRef((props, ref) => {
    return createElement('tr', { ...props, style: [styles.reset, props.style], ref });
});
export const TD = forwardRef((props, ref) => {
    return createElement('td', { ...props, style: [styles.reset, props.style], ref });
});
export const Caption = forwardRef((props, ref) => {
    return createElement('caption', { ...props, style: [styles.reset, props.style], ref });
});
const styles = StyleSheet.create({
    reset: {
        fontFamily: 'System',
        padding: 0,
    },
});
//# sourceMappingURL=Table.web.js.map