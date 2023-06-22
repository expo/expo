import * as React from 'react';
import { View } from 'react-native';

import { BlurViewProps } from './BlurView.types';
import getBackgroundColor from './getBackgroundColor';

export default class BlurView extends React.Component<BlurViewProps> {
  private blurViewRef = React.createRef<View>();

  /**
   * Reanimated will detect and call this function with animated styles passed as props on every
   * animation frame. We want to extract intensity from the props, then create and apply new styles,
   * which create the blur based on the intensity and current tint.
   */
  setNativeProps(nativeProps) {
    const { style, tint, intensity: standardIntensity } = this.props;
    const intensity = nativeProps.style.intensity ?? standardIntensity;
    const blurStyle = getBlurStyle({ intensity, tint });
    this.blurViewRef?.current?.setNativeProps({
      ...nativeProps,
      style: [style, blurStyle, nativeProps.style],
    });
  }

  render() {
    const { tint = 'default', intensity = 50, style, ...props } = this.props;
    const blurStyle = getBlurStyle({ tint, intensity });
    return <View {...props} style={[style, blurStyle]} ref={this.blurViewRef} />;
  }
}

function isBlurSupported(): boolean {
  // TODO: Replace with CSS or static extraction to ensure hydration errors cannot happen.
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
    backgroundColor: getBackgroundColor(Math.min(intensity, 100), tint),
  };

  if (isBlurSupported()) {
    const blur = `saturate(180%) blur(${Math.min(intensity, 100) * 0.2}px)`;
    style.backdropFilter = blur;
    // Safari support
    style.WebkitBackdropFilter = blur;
  }

  return style;
}
