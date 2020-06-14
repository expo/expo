import * as React from 'react';
import { View } from 'react-native';

import { BlurProps } from './BlurView.types';
import getBackgroundColor from './getBackgroundColor';

const BlurView = React.forwardRef<View, BlurProps>(
  ({ tint = 'default', intensity = 100, style, ...props }, ref) => {
    const backgroundColor = getBackgroundColor(intensity, tint);
    return <View {...props} ref={ref} style={[style, { backgroundColor }]} />;
  }
);

export default BlurView;
