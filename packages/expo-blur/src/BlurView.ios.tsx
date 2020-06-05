import { requireNativeViewManager } from '@unimodules/core';
import * as React from 'react';
import { View } from 'react-native';

import { BlurProps } from './BlurView.types';

const BlurView = React.forwardRef<View, BlurProps>(
  ({ tint = 'default', intensity = 50, style, ...props }, ref) => {
    return (
      <NativeBlurView
        {...props}
        tint={tint}
        intensity={intensity}
        ref={ref}
        style={[style, { backgroundColor: 'transparent' }]}
      />
    );
  }
);

const NativeBlurView = requireNativeViewManager('ExpoBlurView');

export default BlurView;
