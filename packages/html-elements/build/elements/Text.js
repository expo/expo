import React, { forwardRef } from 'react';
import { StyleSheet, Platform } from 'react-native';
import { em } from '../css/units';
import Text from '../primitives/Text';
import View from '../primitives/View';
export const P = forwardRef(({ style, ...props }, ref) => {
    return React.createElement(Text, { ...props, style: [styles.p, style], ref: ref });
});
export const B = forwardRef(({ style, ...props }, ref) => {
    return React.createElement(Text, { ...props, style: [styles.b, style], ref: ref });
});
export const S = forwardRef(({ style, ...props }, ref) => {
    return React.createElement(Text, { ...props, style: [styles.s, style], ref: ref });
});
export const I = forwardRef(({ style, ...props }, ref) => {
    return React.createElement(Text, { ...props, style: [styles.i, style], ref: ref });
});
export const Q = forwardRef(({ children, cite, style, ...props }, ref) => {
    return (React.createElement(Text, { ...props, style: [styles.q, style], ref: ref },
        "\"",
        children,
        "\""));
});
export const BlockQuote = forwardRef(({ style, cite, ...props }, ref) => {
    return React.createElement(View, { ...props, style: [styles.blockQuote, style], ref: ref });
});
export const BR = forwardRef(({ style, ...props }, ref) => {
    return React.createElement(Text, { ...props, style: [styles.br, style], ref: ref });
});
export const Mark = forwardRef(({ style, ...props }, ref) => {
    return React.createElement(Text, { ...props, style: [styles.mark, style], ref: ref });
});
export const Code = forwardRef(({ style, ...props }, ref) => {
    return React.createElement(Text, { ...props, style: [styles.code, style], ref: ref });
});
function isTextProps(props) {
    return typeof props.children === 'string';
}
export const Pre = forwardRef((props, ref) => {
    if (isTextProps(props)) {
        return React.createElement(Text, { ...props, style: [styles.code, styles.pre, props.style], ref: ref });
    }
    return React.createElement(View, { ...props, style: [styles.pre, props.style], ref: ref });
});
// Extract dateTime to prevent passing it to the native Text element
export const Time = forwardRef(({ dateTime, ...props }, ref) => {
    return React.createElement(Text, { ...props, ref: ref });
});
export const Strong = B;
export const Del = S;
export const EM = I;
export const Span = Text;
const styles = StyleSheet.create({
    p: {
        // @ts-ignore
        marginVertical: em(1),
    },
    b: {
        fontWeight: 'bold',
    },
    q: {
        fontStyle: 'italic',
    },
    code: {
        fontFamily: Platform.select({ default: 'Courier', ios: 'Courier New', android: 'monospace' }),
        fontWeight: '500',
    },
    pre: {
        // @ts-ignore
        marginVertical: em(1),
    },
    blockQuote: {
        // @ts-ignore
        marginVertical: em(1),
    },
    br: {
        width: 0,
        // @ts-ignore
        height: em(0.5),
    },
    s: {
        textDecorationLine: 'line-through',
        textDecorationStyle: 'solid',
    },
    mark: {
        backgroundColor: 'yellow',
        color: 'black',
    },
    i: {
        fontStyle: 'italic',
    },
});
//# sourceMappingURL=Text.js.map