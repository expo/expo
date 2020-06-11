import { NativeModulesProxy, requireNativeViewManager } from '@unimodules/core';
import * as React from 'react';
import { findNodeHandle } from 'react-native';
const BlurView = React.forwardRef(({ tint = 'default', intensity = 50, style, ...props }, ref) => {
    const nativeRef = React.useRef(null);
    React.useImperativeHandle(ref, () => {
        const view = nativeRef.current;
        if (view) {
            const setNativeProps = view.setNativeProps.bind(view);
            view.setNativeProps = props => {
                NativeModulesProxy.ExpoBlurViewManager.updateProps(props, findNodeHandle(view));
                setNativeProps(props);
            };
        }
        return view;
    }, [nativeRef.current]);
    return (React.createElement(NativeBlurView, Object.assign({}, props, { tint: tint, intensity: intensity, ref: nativeRef, style: [style, { backgroundColor: 'transparent' }] })));
});
const NativeBlurView = requireNativeViewManager('ExpoBlurView');
export default BlurView;
//# sourceMappingURL=BlurView.ios.js.map