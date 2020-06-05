import * as React from 'react';
import { View } from 'react-native';
import getBackgroundColor from './getBackgroundColor';
const BlurView = React.forwardRef(({ tint = 'default', intensity = 100, style, ...props }, ref) => {
    const backgroundColor = getBackgroundColor(intensity, tint);
    return React.createElement(View, Object.assign({}, props, { ref: ref, style: [style, { backgroundColor }] }));
});
export default BlurView;
//# sourceMappingURL=BlurView.android.js.map