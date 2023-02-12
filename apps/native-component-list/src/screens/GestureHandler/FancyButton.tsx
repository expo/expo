import React, { Component } from 'react';
import { StyleSheet, View, StyleProp, ViewStyle } from 'react-native';
import {
  LongPressGestureHandler,
  State,
  TapGestureHandler,
  LongPressGestureHandlerStateChangeEvent,
  TapGestureHandlerStateChangeEvent,
} from 'react-native-gesture-handler';

interface FBState {
  singleTap?: State;
  longPress?: State;
}

export default class FancyButton extends Component<
  {
    style?: StyleProp<ViewStyle>;
    onLongPress?: () => void;
    onSingleTap?: () => void;
    onDoubleTap?: () => void;
    children?: React.ReactNode;
  },
  FBState
> {
  doubleTapRef = React.createRef<TapGestureHandler>();

  readonly state: FBState = {};

  render() {
    return (
      <LongPressGestureHandler minDurationMs={800} onHandlerStateChange={this._onLongPressEvent}>
        <TapGestureHandler
          numberOfTaps={1}
          waitFor={this.doubleTapRef}
          onHandlerStateChange={this._onSingleTapEvent}>
          <TapGestureHandler
            numberOfTaps={2}
            ref={this.doubleTapRef}
            onHandlerStateChange={this._onDoubleTapEvent}>
            <View
              style={[styles.button, this.props.style, { opacity: this._isPressed() ? 0.5 : 1 }]}>
              {this.props.children}
            </View>
          </TapGestureHandler>
        </TapGestureHandler>
      </LongPressGestureHandler>
    );
  }

  _isPressed = () => {
    const { longPress, singleTap } = this.state;

    // Intentionally leave out double tap
    if (longPress === State.BEGAN || singleTap === State.BEGAN) {
      return true;
    } else {
      return false;
    }
  };

  _onLongPressEvent = (event: LongPressGestureHandlerStateChangeEvent) => {
    const { state } = event.nativeEvent;
    this.setState({ longPress: state });

    if (state === State.ACTIVE) {
      this.props.onLongPress && this.props.onLongPress();
    }
  };

  _onSingleTapEvent = (event: TapGestureHandlerStateChangeEvent) => {
    const { state } = event.nativeEvent;
    this.setState({ singleTap: state });

    if (state === State.ACTIVE) {
      this.props.onSingleTap && this.props.onSingleTap();
    }
  };

  _onDoubleTapEvent = (event: TapGestureHandlerStateChangeEvent) => {
    const { state } = event.nativeEvent;

    if (state === State.ACTIVE) {
      this.props.onDoubleTap && this.props.onDoubleTap();
    }
  };
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 30,
    paddingVertical: 20,
    backgroundColor: '#cacaca',
    borderRadius: 5,
    alignItems: 'center',
  },
});
