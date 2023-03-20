import { requireNativeModule, requireNativeViewManager } from 'expo-modules-core';
import React from 'react';
import { View, StyleSheet, findNodeHandle } from 'react-native';

import { BlurViewProps } from './BlurView.types';
import { getAndroidTintColor } from './getBackgroundColor';

type BlurViewForwardedRefProp = {
  forwardedRef: React.ForwardedRef<View>;
};

const ExpoBlurView = requireNativeModule('ExpoBlurView');

class BlurView extends React.Component<BlurViewProps & BlurViewForwardedRefProp> {
  private blurViewRef = React.createRef<View>();

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
  private onRefChange = (view: View | null) => {
    if (!view) {
      return;
    }

    // Save the reference to the original method already bound to the proper calling context
    const originalSetNativeProps = view.setNativeProps.bind(view);

    // Override `setNativeProps` (https://reactnative.dev/docs/animations#setnativeprops)
    view.setNativeProps = ({
      tint,
      intensity,
      blurReductionFactor,
      ...nativeProps
    }: BlurViewProps) => {
      // Call the original method with all View-based props
      view && originalSetNativeProps(nativeProps);
      // Invoke `setNativeProps` native expo method defined by `ExpoBlurView` module
      this.blurViewRef.current &&
        ExpoBlurView.setNativeProps(
          { tint, intensity, blurReductionFactor },
          findNodeHandle(this.blurViewRef.current)
        );
    };

    // mimic `forwardedRef` logic
    if (typeof this.props.forwardedRef === 'function') {
      this.props.forwardedRef(view);
    } else if (this.props.forwardedRef) {
      this.props.forwardedRef.current = view;
    }
  };

  render() {
    const {
      tint = 'default',
      intensity = 50,
      blurReductionFactor = 4,
      style,
      children,
      forwardedRef,
      ...props
    } = this.props;
    return (
      <View {...props} ref={this.onRefChange} style={[styles.container, style]}>
        <NativeBlurView
          ref={this.blurViewRef}
          tint={tint}
          // Android uses this prop instead of the `tint`
          tintColor={getAndroidTintColor(intensity, tint)}
          intensity={intensity}
          blurReductionFactor={blurReductionFactor}
          style={StyleSheet.absoluteFill}
        />
        {children}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { backgroundColor: 'transparent' },
});

const NativeBlurView = requireNativeViewManager('ExpoBlurView');

// This `forwardedRef` mechanism is necessary to make this component work properly
// with React's `ref` prop and to react to props updates as expected.
/**
 * A React component that blurs everything underneath the view.
 */
const BlurViewWithForwardedRef = React.forwardRef<View, BlurViewProps>(
  (props: BlurViewProps, forwardRef: React.ForwardedRef<View>) => (
    <BlurView {...props} forwardedRef={forwardRef} />
  )
);

export default BlurViewWithForwardedRef;
