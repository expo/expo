import { NativeModulesProxy, requireNativeViewManager } from 'expo-modules-core';
import React from 'react';
import { View, StyleSheet, findNodeHandle } from 'react-native';
class BlurView extends React.Component {
    blurViewRef = React.createRef();
    /**
     * This component is a composition of the two components, but from the outside it's
     * just a simple View with additional properties. To properly handle `setNativeProps`
     * method (used when animating props), we need to properly separate `ViewProps` from `BlurViewProps`
     * and pass them to the proper underlying views.
     *
     * This method handles the native view reference obtained from the parent View component
     * and overrides it's original `setNativeProps` method that is available as it's property.
     * When the `NativeBlurView` native ref is available `BlurView`-only props are forwarded
     * to this view using `setNativeProps` method exposed by the native runtime.
     */
    onRefChange = (view) => {
        if (!view) {
            return;
        }
        // Save the reference to the original method already bound to the proper calling context
        const originalSetNativeProps = view.setNativeProps.bind(view);
        // Override `setNativeProps` (https://reactnative.dev/docs/animations#setnativeprops)
        view.setNativeProps = ({ tint, intensity, ...nativeProps }) => {
            // Call the original method with all View-based props
            view && originalSetNativeProps(nativeProps);
            // Invoke `setNativeProps` native expo method defined by `ExpoBlurViewManager`
            this.blurViewRef.current &&
                NativeModulesProxy.ExpoBlurViewManager.setNativeProps({ tint, intensity }, findNodeHandle(this.blurViewRef.current));
        };
        // mimic `forwardedRef` logic
        if (typeof this.props.forwardedRef === 'function') {
            this.props.forwardedRef(view);
        }
        else if (this.props.forwardedRef) {
            this.props.forwardedRef.current = view;
        }
    };
    render() {
        const { tint = 'default', intensity = 50, style, children, forwardedRef, ...props } = this.props;
        return (React.createElement(View, { ...props, ref: this.onRefChange, style: [styles.container, style] },
            React.createElement(NativeBlurView, { ref: this.blurViewRef, tint: tint, intensity: intensity, style: StyleSheet.absoluteFill }),
            children));
    }
}
const styles = StyleSheet.create({
    container: { backgroundColor: 'transparent' },
});
const NativeBlurView = requireNativeViewManager('ExpoBlurView');
// This `forwardedRef` mechanism is necessary to make this component work properly
// with React's `ref` prop and to react to props updates as expected.
const BlurViewWithForwardedRef = React.forwardRef((props, forwardRef) => (React.createElement(BlurView, { ...props, forwardedRef: forwardRef })));
export default BlurViewWithForwardedRef;
//# sourceMappingURL=BlurView.js.map