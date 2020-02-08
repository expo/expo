import React, { forwardRef } from 'react';
import { StyleSheet } from 'react-native';
import { em } from '../css/units';
import Text from '../primitives/Text';
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
export const Br = forwardRef(({ style, ...props }, ref) => {
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
export const Strong = B;
export const Del = S;
export const Em = I;
const styles = StyleSheet.create({
    p: {
        marginVertical: em(1),
        fontSize: em(1),
    },
    b: {
        fontWeight: 'bold',
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