import React, { forwardRef } from 'react';
import { Platform } from 'react-native';
import View from '../primitives/View';
const nativeProps = Platform.select({
    web: {
        accessibilityRole: 'main',
    },
    default: {},
});
export const Main = forwardRef((props, ref) => {
    return <View {...nativeProps} {...props} ref={ref}/>;
});
//# sourceMappingURL=Main.js.map