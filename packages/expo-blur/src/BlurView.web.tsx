import * as React from 'react';
import { View } from 'react-native';

import { BlurViewProps } from './BlurView.types';
import getBackgroundColor from './getBackgroundColor';

export default class BlurView extends React.Component<BlurViewProps> {
  render() {
    const { tint = 'default', intensity = 50, style, ...props } = this.props;
    const blurStyle = getBlurStyle({ tint, intensity: Math.min(intensity, 100) });
    return <View {...props} style={[style, blurStyle]} />;
  }
}

function getBlurStyle({ intensity, tint }): Record<string, string> {
  const style: Record<string, string> = {
    backgroundColor: getBackgroundColor(intensity, tint),
  };

  const blur = `saturate(180%) blur(${intensity * 0.2}px)`;
  style.backdropFilter = blur;
  // Safari support
  style['-webkit-backdrop-filter'] = blur;

  return style;
}
