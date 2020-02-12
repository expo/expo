import React, { forwardRef } from 'react';
import { Platform } from 'react-native';
import View from '../primitives/View';
const nativeProps = Platform.select({
    web: {
        accessibilityRole: 'article',
    },
    default: {},
});
export const Article = forwardRef((props, ref) => {
    return <View {...props} {...nativeProps} ref={ref}/>;
});
//# sourceMappingURL=Article.js.map