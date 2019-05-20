import PropTypes from 'prop-types';
import * as React from 'react';
import { View, ViewPropTypes } from 'react-native';

import { BlurTint, Props } from './BlurView.types';
import getBackgroundColor from './getBackgroundColor';

export default class BlurView extends React.Component<Props> {
  static propTypes = {
    tint: PropTypes.oneOf(['light', 'default', 'dark']),
    ...ViewPropTypes,
  };

  static defaultProps = {
    tint: 'default' as BlurTint,
    intensity: 50,
  };

  render() {
    let { tint, intensity, style = {}, ...props } = this.props;

    const blurStyle = getBlurStyle({ tint, intensity });

    return <View {...props} style={[style, blurStyle]} />;
  }
}

function isBlurSupported(): boolean {
  // https://developer.mozilla.org/en-US/docs/Web/API/CSS/supports
  // https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter#Browser_compatibility
  // TODO: Bacon: Chrome blur seems broken natively
  return typeof CSS !== 'undefined' && CSS.supports('-webkit-backdrop-filter', 'blur(1px)');
  // TODO: Bacon: Chrome doesn't work, RNWeb uses webkit on Safari, which works.
  // || CSS.supports('backdrop-filter', 'blur(1px)')
}

function getBlurStyle({ intensity, tint }): { [key: string]: string } {
  if (isBlurSupported()) {
    let backdropFilter = `blur(${intensity * 0.25}px)`;
    if (tint === 'dark') {
      backdropFilter += ' brightness(50%)';
    } else if (tint === 'light') {
      backdropFilter += ' brightness(150%)';
    }
    return {
      backdropFilter,
    };
  } else {
    let backgroundColor = getBackgroundColor(intensity, tint);
    return { backgroundColor };
  }
}
