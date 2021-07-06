import { forwardRef } from 'react';
import { StyleSheet } from 'react-native';
import createElement from 'react-native-web/dist/exports/createElement';
export const P = forwardRef(({ style, ...props }, ref) => {
    return createElement('p', { ...props, style: [styles.reset, style], ref });
});
export const B = forwardRef(({ style, ...props }, ref) => {
    return createElement('b', { ...props, style: [styles.reset, style], ref });
});
export const S = forwardRef(({ style, ...props }, ref) => {
    return createElement('s', { ...props, style: [styles.reset, style], ref });
});
export const Del = forwardRef(({ style, ...props }, ref) => {
    return createElement('del', { ...props, style: [styles.reset, style], ref });
});
export const Strong = forwardRef(({ style, ...props }, ref) => {
    return createElement('strong', { ...props, style: [styles.reset, style], ref });
});
export const I = forwardRef(({ style, ...props }, ref) => {
    return createElement('i', { ...props, style: [styles.reset, style], ref });
});
export const Q = forwardRef(({ style, ...props }, ref) => {
    return createElement('q', { ...props, style: [styles.reset, style], ref });
});
export const BlockQuote = forwardRef(({ style, ...props }, ref) => {
    return createElement('blockquote', { ...props, style: [styles.reset, style], ref });
});
export const EM = forwardRef(({ style, ...props }, ref) => {
    return createElement('em', { ...props, style: [styles.reset, style], ref });
});
export const BR = forwardRef((props, ref) => {
    return createElement('br', { ...props, ref });
});
export const Small = forwardRef(({ style, ...props }, ref) => {
    return createElement('small', { ...props, style: [styles.reset, style], ref });
});
export const Mark = forwardRef(({ style, ...props }, ref) => {
    return createElement('mark', { ...props, style: [styles.reset, style], ref });
});
export const Code = forwardRef((props, ref) => {
    return createElement('code', { ...props, ref });
});
export const Time = forwardRef(({ style, ...props }, ref) => {
    return createElement('time', { ...props, style: [styles.reset, style], ref });
});
export const Pre = forwardRef(({ style, ...props }, ref) => {
    return createElement('pre', { ...props, style: [styles.reset, style], ref });
});
const styles = StyleSheet.create({
    reset: {
        fontFamily: 'System',
        color: '#000',
        border: '0 solid black',
        boxSizing: 'border-box',
        // @ts-ignore: inline is not supported
        display: 'inline',
        margin: 0,
        padding: 0,
        whiteSpace: 'pre-wrap',
        wordWrap: 'break-word',
    },
});
//# sourceMappingURL=_Text.web.js.map