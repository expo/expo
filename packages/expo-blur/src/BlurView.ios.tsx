import { NativeModulesProxy, requireNativeViewManager } from '@unimodules/core';
import * as React from 'react';
import { findNodeHandle, View } from 'react-native';

import { BlurProps } from './BlurView.types';

const BlurView = React.forwardRef<View, BlurProps>(
  ({ tint = 'default', intensity = 50, style, ...props }, ref) => {
    const nativeRef = React.useRef<View>(null);

    React.useImperativeHandle(
      ref,
      () => {
        const view = nativeRef.current;
        if (view) {
          const setNativeProps = view.setNativeProps.bind(view);
          view.setNativeProps = props => {
            NativeModulesProxy.ExpoBlurViewManager.updateProps(props, findNodeHandle(view));
            setNativeProps(props);
          };
        }
        return view as View;
      },
      [nativeRef.current]
    );

    return (
      <NativeBlurView
        {...props}
        tint={tint}
        intensity={intensity}
        ref={nativeRef}
        style={[style, { backgroundColor: 'transparent' }]}
      />
    );
  }
);

const NativeBlurView = requireNativeViewManager('ExpoBlurView');

export default BlurView;
