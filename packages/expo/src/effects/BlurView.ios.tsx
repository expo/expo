import PropTypes from 'prop-types';
import * as React from 'react';
import { View, ViewPropTypes, requireNativeComponent } from 'react-native';

type Props = {
  tint: BlurTint;
  intensity: number;
} & React.ElementProps<View>;
type BlurTint = 'light' | 'dark' | 'default';

export default class BlurView extends React.Component<Props> {
  static propTypes = {
    ...ViewPropTypes,
    tint: PropTypes.oneOf(['light', 'default', 'dark'] as BlurTint[]).isRequired,
    intensity: PropTypes.number.isRequired,
  };

  static defaultProps = {
    tint: 'default' as BlurTint,
    intensity: 50,
  };

  render() {
    let { style, ...props } = this.props;
    return <NativeBlurView {...props} style={[style, { backgroundColor: 'transparent' }]} />;
  }
}

const NativeBlurView = requireNativeComponent('ExponentBlurView', BlurView);
