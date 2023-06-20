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

function isBlurSupported(): boolean {
  // Enable by default in Node.js
  if (typeof window === 'undefined') {
    return true;
  }
  // https://developer.mozilla.org/en-US/docs/Web/API/CSS/supports
  // https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter#Browser_compatibility
  return (
    typeof CSS !== 'undefined' &&
    (CSS.supports('-webkit-backdrop-filter', 'blur(1px)') ||
      CSS.supports('backdrop-filter', 'blur(1px)'))
  );
}

function getBlurStyle({ intensity, tint }): Record<string, string> {
  const style: Record<string, string> = {
    backgroundColor: getBackgroundColor(intensity, tint),
  };

  if (isBlurSupported()) {
    const blur = `saturate(180%) blur(${intensity * 0.2}px)`;
    style.backdropFilter = blur;
    // Safari support
    style.WebkitBackdropFilter = blur;
  }

  return style;
}
