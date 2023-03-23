import { requireNativeViewManager } from 'expo-modules-core';
import React from 'react';
import { View, StyleSheet } from 'react-native';
const NativeBlurView = requireNativeViewManager('ExpoBlurView');
class BlurView extends React.Component {
    /**
     * This component is a composition of the two components, but from the outside it's
     * just a simple View with additional properties. To properly handle `setNativeProps`
     * method (used when animating props), we need to properly separate `ViewProps` from `BlurViewProps`
     * and pass them to the proper underlying views.
     *
     * This method handles the native view reference obtained from the parent View component
     * and overrides its original `setNativeProps` method that is available as its property.
     * When the `NativeBlurView` native ref is available `BlurView`-only props are forwarded
     * to this view using `setNativeProps` method exposed by the native runtime.
     */
    render() {
        const { tint = 'default', intensity = 50, blurReductionFactor = 4, style, children, forwardedRef, ...props } = this.props;
        return (React.createElement(View, { ...props, style: [styles.container, style] },
            React.createElement(NativeBlurView, { ref: forwardedRef, tint: tint, 
                // Android uses this prop instead of the `tint`
                intensity: intensity, blurReductionFactor: blurReductionFactor, style: StyleSheet.absoluteFill }),
            children));
    }
}
const styles = StyleSheet.create({
    container: { backgroundColor: 'transparent' },
});
// This `forwardedRef` mechanism is necessary to make this component work properly
// with React's `ref` prop and to react to props updates as expected.
/**
 * A React component that blurs everything underneath the view.
 */
const BlurViewWithForwardedRef = React.forwardRef((props, forwardRef) => {
    return React.createElement(BlurView, { ...props, forwardedRef: forwardRef });
});
export default BlurViewWithForwardedRef;
//# sourceMappingURL=BlurView.js.map