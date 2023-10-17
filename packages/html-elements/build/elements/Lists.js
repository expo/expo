import React, { forwardRef } from 'react';
import { Platform } from 'react-native';
import Text from '../primitives/Text';
import View from '../primitives/View';
function createView(nativeProps = {}) {
    return forwardRef((props, ref) => {
        return <View {...nativeProps} {...props} ref={ref}/>;
    });
}
export const UL = createView(Platform.select({
    web: {
        accessibilityRole: 'list',
    },
}));
function isTextProps(props) {
    // Treat <li></li> as a Text element.
    return typeof props.children === 'string';
}
export const LI = forwardRef((props, ref) => {
    if (isTextProps(props)) {
        const accessibilityRole = Platform.select({
            web: 'listitem',
            default: props.accessibilityRole,
        });
        return <Text {...props} accessibilityRole={accessibilityRole} ref={ref}/>;
    }
    const accessibilityRole = Platform.select({
        web: 'listitem',
        default: props.accessibilityRole,
    });
    return <View {...props} accessibilityRole={accessibilityRole} ref={ref}/>;
});
//# sourceMappingURL=Lists.js.map