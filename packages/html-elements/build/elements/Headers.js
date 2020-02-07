import React from 'react';
import { StyleSheet, Platform } from 'react-native';
import Text from '../primitives/Text';
import { em } from '../css/units';
function createHeaderComponent(level) {
    const nativeProps = Platform.select({
        web: {
            'aria-level': `${level}`,
        },
        default: {},
    });
    return React.forwardRef((props, ref) => {
        return (<Text {...nativeProps} accessibilityRole="header" {...props} style={[styles[`h${level}`], props.style]} ref={ref}/>);
    });
}
export const H1 = createHeaderComponent(1);
export const H2 = createHeaderComponent(2);
export const H3 = createHeaderComponent(3);
export const H4 = createHeaderComponent(4);
export const H5 = createHeaderComponent(5);
export const H6 = createHeaderComponent(6);
// Default web styles: https://www.w3schools.com/tags/tag_hn.asp
const styles = StyleSheet.create({
    h1: {
        fontSize: em(2),
        marginVertical: em(0.67),
        fontWeight: 'bold',
    },
    h2: {
        fontSize: em(1.5),
        marginVertical: em(0.83),
        fontWeight: 'bold',
    },
    h3: {
        fontSize: em(1.17),
        marginVertical: em(1),
        fontWeight: 'bold',
    },
    h4: {
        fontSize: em(1),
        marginVertical: em(1.33),
        fontWeight: 'bold',
    },
    h5: {
        fontSize: em(0.83),
        marginVertical: em(1.67),
        fontWeight: 'bold',
    },
    h6: {
        fontSize: em(0.67),
        marginVertical: em(2.33),
        fontWeight: 'bold',
    },
});
//# sourceMappingURL=Headers.js.map