import React, { forwardRef } from 'react';
import { StyleSheet } from 'react-native';
import { em } from '../css/units';
import Text from '../primitives/Text';
import View from '../primitives/View';
export const P = forwardRef(({ style, ...props }, ref) => {
    return <Text {...props} style={[styles.p, style]} ref={ref}/>;
});
export const B = forwardRef(({ style, ...props }, ref) => {
    return <P {...props} style={[styles.b, style]} ref={ref}/>;
});
export const S = forwardRef(({ style, ...props }, ref) => {
    return <P {...props} style={[styles.s, style]} ref={ref}/>;
});
export const I = forwardRef(({ style, ...props }, ref) => {
    return <P {...props} style={[styles.i, style]} ref={ref}/>;
});
export const Q = forwardRef(({ children, cite, style, ...props }, ref) => {
    return (<P {...props} style={[styles.q, style]} ref={ref}>
      "{children}"
    </P>);
});
export const BlockQuote = forwardRef(({ style, cite, ...props }, ref) => {
    return <View {...props} style={[styles.blockQuote, style]} ref={ref}/>;
});
export const BR = forwardRef(({ style, ...props }, ref) => {
    return <Text {...props} style={[styles.br, style]} ref={ref}/>;
});
export const Small = forwardRef(({ style, ...props }, ref) => {
    return <Text {...props} style={[styles.small, style]} ref={ref}/>;
});
export const Mark = forwardRef(({ style, ...props }, ref) => {
    return <Text {...props} style={[styles.mark, style]} ref={ref}/>;
});
// TODO: Lazy load mono font on native
export const Code = forwardRef((props, ref) => {
    return <Text {...props} ref={ref}/>;
});
function isTextProps(props) {
    return typeof props.children === 'string';
}
// TODO: Lazy load mono font on native
export const Pre = forwardRef((props, ref) => {
    if (isTextProps(props)) {
        return <Text {...props} style={[styles.pre, props.style]} ref={ref}/>;
    }
    return <View {...props} style={[styles.pre, props.style]} ref={ref}/>;
});
// Extract dateTime to prevent passing it to the native Text element
export const Time = forwardRef(({ dateTime, ...props }, ref) => {
    return <Text {...props} ref={ref}/>;
});
export const Strong = B;
export const Del = S;
export const EM = I;
const styles = StyleSheet.create({
    p: {
        marginVertical: em(1),
        fontSize: em(1),
    },
    b: {
        fontWeight: 'bold',
    },
    q: {
        fontStyle: 'italic',
    },
    pre: {
        marginVertical: em(1),
    },
    blockQuote: {
        marginVertical: em(1),
    },
    br: {
        width: 0,
        height: 8,
    },
    small: {
        fontSize: 10,
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