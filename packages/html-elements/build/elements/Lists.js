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
        role: 'list',
    },
}));
function isTextProps(props) {
    // Treat <li></li> as a Text element.
    return typeof props.children === 'string';
}
export const LI = forwardRef((props, ref) => {
    if (isTextProps(props)) {
        const role = Platform.select({
            web: 'listitem',
            default: props.role,
        });
        return <Text {...props} role={role} ref={ref}/>;
    }
    const role = Platform.select({
        web: 'listitem',
        default: props.role,
    });
    return <View {...props} role={role} ref={ref}/>;
});
//# sourceMappingURL=Lists.js.map