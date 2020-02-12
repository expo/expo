import React, { forwardRef } from 'react';
import { Platform } from 'react-native';
import View from '../primitives/View';
const nativeProps = Platform.select({
    web: {
        accessibilityRole: 'banner',
    },
    default: {
        accessibilityRole: 'header',
    },
});
export const Header = forwardRef((props, ref) => {
    return <View {...nativeProps} {...props} ref={ref}/>;
});
//# sourceMappingURL=Header.js.map