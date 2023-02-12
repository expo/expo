import * as React from 'react';
import { Component } from 'react';
import GenericTouchable, {
  GenericTouchableProps,
  TOUCHABLE_STATE,
} from './GenericTouchable';
import {
  StyleSheet,
  View,
  TouchableHighlightProps,
  ColorValue,
  ViewProps,
} from 'react-native';

interface State {
  extraChildStyle: null | {
    opacity?: number;
  };
  extraUnderlayStyle: null | {
    backgroundColor?: ColorValue;
  };
}

/**
 * TouchableHighlight follows RN's implementation
 */
export default class TouchableHighlight extends Component<
  TouchableHighlightProps & GenericTouchableProps,
  State
> {
  static defaultProps = {
    ...GenericTouchable.defaultProps,
    activeOpacity: 0.85,
    delayPressOut: 100,
    underlayColor: 'black',
  };

  constructor(props: TouchableHighlightProps & GenericTouchableProps) {
    super(props);
    this.state = {
      extraChildStyle: null,
      extraUnderlayStyle: null,
    };
  }

  // Copied from RN
  showUnderlay = () => {
    if (!this.hasPressHandler()) {
      return;
    }
    this.setState({
      extraChildStyle: {
        opacity: this.props.activeOpacity,
      },
      extraUnderlayStyle: {
        backgroundColor: this.props.underlayColor,
      },
    });
    this.props.onShowUnderlay?.();
  };

  hasPressHandler = () =>
    this.props.onPress ||
    this.props.onPressIn ||
    this.props.onPressOut ||
    this.props.onLongPress;

  hideUnderlay = () => {
    this.setState({
      extraChildStyle: null,
      extraUnderlayStyle: null,
    });
    this.props.onHideUnderlay?.();
  };

  renderChildren() {
    if (!this.props.children) {
      return <View />;
    }

    const child = React.Children.only(
      this.props.children
    ) as React.ReactElement<ViewProps>; // TODO: not sure if OK but fixes error
    return React.cloneElement(child, {
      style: StyleSheet.compose(child.props.style, this.state.extraChildStyle),
    });
  }

  onStateChange = (_from: number, to: number) => {
    if (to === TOUCHABLE_STATE.BEGAN) {
      this.showUnderlay();
    } else if (
      to === TOUCHABLE_STATE.UNDETERMINED ||
      to === TOUCHABLE_STATE.MOVED_OUTSIDE
    ) {
      this.hideUnderlay();
    }
  };

  render() {
    const { style = {}, ...rest } = this.props;
    const { extraUnderlayStyle } = this.state;
    return (
      <GenericTouchable
        {...rest}
        style={[style, extraUnderlayStyle]}
        onStateChange={this.onStateChange}>
        {this.renderChildren()}
      </GenericTouchable>
    );
  }
}
