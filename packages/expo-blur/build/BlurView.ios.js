import { requireNativeViewManager } from '@unimodules/core';
import * as React from 'react';
const BlurView = React.forwardRef(({ tint = 'default', intensity = 50, style, ...props }, ref) => {
    return (React.createElement(NativeBlurView, Object.assign({}, props, { tint: tint, intensity: intensity, ref: ref, style: [style, { backgroundColor: 'transparent' }] })));
});
const NativeBlurView = requireNativeViewManager('ExpoBlurView');
export default BlurView;
//# sourceMappingURL=BlurView.ios.js.map