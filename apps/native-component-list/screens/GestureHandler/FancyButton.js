import React, { Component } from 'react';
import { StyleSheet, View } from 'react-native';
import { LongPressGestureHandler, State, TapGestureHandler } from 'react-native-gesture-handler';

export default class FancyButton extends Component {
  doubleTapRef = React.createRef();

  state = {
    singleTap: null,
    longPress: null,
  };

  render() {
    return (
      <LongPressGestureHandler minDurationMs={800} onHandlerStateChange={this._onLongPressEvent}>
        <TapGestureHandler
          waitFor={this.state.doubleTapId}
          numberOfTaps={1}
          waitFor={this.doubleTapRef}
          onHandlerStateChange={this._onSingleTapEvent}>
          <TapGestureHandler
            id={this.state.doubleTapId}
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

  _onLongPressEvent = event => {
    let { state } = event.nativeEvent;
    this.setState({ longPress: state });

    if (state === State.ACTIVE) {
      this.props.onLongPress && this.props.onLongPress();
    }
  };

  _onSingleTapEvent = event => {
    let { state } = event.nativeEvent;
    this.setState({ singleTap: state });

    if (state === State.ACTIVE) {
      this.props.onSingleTap && this.props.onSingleTap();
    }
  };

  _onDoubleTapEvent = event => {
    let { state } = event.nativeEvent;

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
