import React, { forwardRef } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { em } from '../css/units';
import Text from '../primitives/Text';
function createHeadingComponent(level) {
    const nativeProps = Platform.select({
        web: {
            accessibilityLevel: level,
        },
        default: {},
    });
    return forwardRef((props, ref) => {
        return (React.createElement(Text, { ...nativeProps, accessibilityRole: "header", ...props, style: [styles[`h${level}`], props.style], ref: ref }));
    });
}
export const H1 = createHeadingComponent(1);
export const H2 = createHeadingComponent(2);
export const H3 = createHeadingComponent(3);
export const H4 = createHeadingComponent(4);
export const H5 = createHeadingComponent(5);
export const H6 = createHeadingComponent(6);
// Default web styles: http://trac.webkit.org/browser/trunk/Source/WebCore/css/html.css
const styles = StyleSheet.create({
    h1: {
        // @ts-ignore
        fontSize: em(2),
        // @ts-ignore
        marginVertical: em(0.67),
        fontWeight: 'bold',
    },
    h2: {
        // @ts-ignore
        fontSize: em(1.5),
        // @ts-ignore
        marginVertical: em(0.83),
        fontWeight: 'bold',
    },
    h3: {
        // @ts-ignore
        fontSize: em(1.17),
        // @ts-ignore
        marginVertical: em(1),
        fontWeight: 'bold',
    },
    h4: {
        // @ts-ignore
        fontSize: em(1),
        // @ts-ignore
        marginVertical: em(1.33),
        fontWeight: 'bold',
    },
    h5: {
        // @ts-ignore
        fontSize: em(0.83),
        // @ts-ignore
        marginVertical: em(1.67),
        fontWeight: 'bold',
    },
    h6: {
        // @ts-ignore
        fontSize: em(0.67),
        // @ts-ignore
        marginVertical: em(2.33),
        fontWeight: 'bold',
    },
});
//# sourceMappingURL=Headings.js.map