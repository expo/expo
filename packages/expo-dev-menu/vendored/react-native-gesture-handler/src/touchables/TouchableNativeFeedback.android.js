import { Platform } from 'react-native';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import GenericTouchable from './GenericTouchable';

/**
 * TouchableNativeFeedback behaves slightly different than RN's TouchableNativeFeedback.
 * There's small difference with handling long press ripple since RN's implementation calls
 * ripple animation via bridge. This solution leaves all animations' handling for native components so
 * it follows native behaviours.
 */
export default class TouchableNativeFeedback extends Component {
  static SelectableBackground = rippleRadius => ({
    type: 'SelectableBackground',
    rippleRadius,
  });
  static SelectableBackgroundBorderless = rippleRadius => ({
    type: 'SelectableBackgroundBorderless',
    rippleRadius,
  });
  static Ripple = (color, borderless, rippleRadius) => ({
    type: 'Ripple',
    color,
    borderless,
    rippleRadius,
  });

  static canUseNativeForeground = () => Platform.Version >= 23;

  static defaultProps = {
    ...GenericTouchable.defaultProps,
    useForeground: true,
    extraButtonProps: {
      // Disable hiding ripple on Android
      rippleColor: null,
    },
  };

  static propTypes = {
    ...GenericTouchable.publicPropTypes,
    useForeground: PropTypes.bool,
    background: PropTypes.object,
    style: PropTypes.any,
  };

  getExtraButtonProps() {
    const extraProps = {};
    const { background } = this.props;
    if (background) {
      if (background.type === 'Ripple') {
        extraProps['borderless'] = background.borderless;
        extraProps['rippleColor'] = background.color;
        extraProps['rippleRadius'] = background.rippleRadius;
      } else if (background.type === 'SelectableBackgroundBorderless') {
        extraProps['borderless'] = true;
        extraProps['rippleRadius'] = background.rippleRadius;
      }
    }
    extraProps['foreground'] = this.props.useForeground;
    return extraProps;
  }
  render() {
    const { style = {}, ...rest } = this.props;
    return (
      <GenericTouchable
        {...rest}
        style={style}
        extraButtonProps={this.getExtraButtonProps()}
      />
    );
  }
}
