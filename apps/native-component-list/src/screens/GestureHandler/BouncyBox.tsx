import React, { Component } from 'react';
import { Animated, StyleSheet, View, StyleProp, ViewStyle } from 'react-native';
import {
  PanGestureHandler,
  RotationGestureHandler,
  State,
  PanGestureHandlerStateChangeEvent,
  RotationGestureHandlerStateChangeEvent,
} from 'react-native-gesture-handler';

const USE_NATIVE_DRIVER = true;

class Snappable extends Component<{ children?: React.ReactNode }> {
  _dragX = new Animated.Value(0);
  _transX = this._dragX.interpolate({
    inputRange: [-100, -50, 0, 50, 100],
    outputRange: [-30, -10, 0, 10, 30],
  });
  _onGestureEvent = Animated.event([{ nativeEvent: { translationX: this._dragX } }], {
    useNativeDriver: USE_NATIVE_DRIVER,
  });
  _onHandlerStateChange = (event: PanGestureHandlerStateChangeEvent) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      Animated.spring(this._dragX, {
        velocity: event.nativeEvent.velocityX,
        tension: 10,
        friction: 2,
        toValue: 0,
        useNativeDriver: USE_NATIVE_DRIVER,
      }).start();
    }
  };
  render() {
    const { children } = this.props;
    return (
      <PanGestureHandler
        {...this.props}
        maxPointers={1}
        onGestureEvent={this._onGestureEvent}
        onHandlerStateChange={this._onHandlerStateChange}>
        <Animated.View style={{ transform: [{ translateX: this._transX }] }}>
          {children}
        </Animated.View>
      </PanGestureHandler>
    );
  }
}

class Twistable extends Component<{ children?: React.ReactNode }> {
  _gesture = new Animated.Value(0);

  _rot = this._gesture
    .interpolate({
      inputRange: [-1.2, -1, -0.5, 0, 0.5, 1, 1.2],
      outputRange: [-0.52, -0.5, -0.3, 0, 0.3, 0.5, 0.52],
    })
    .interpolate({
      inputRange: [-100, 100],
      outputRange: ['-100rad', '100rad'],
    });

  _onGestureEvent = Animated.event([{ nativeEvent: { rotation: this._gesture } }], {
    useNativeDriver: USE_NATIVE_DRIVER,
  });

  _onHandlerStateChange = (event: RotationGestureHandlerStateChangeEvent) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      Animated.spring(this._gesture, {
        velocity: event.nativeEvent.velocity,
        tension: 10,
        friction: 0.2,
        toValue: 0,
        useNativeDriver: USE_NATIVE_DRIVER,
      }).start();
    }
  };
  render() {
    const { children } = this.props;
    return (
      <RotationGestureHandler
        {...this.props}
        onGestureEvent={this._onGestureEvent}
        onHandlerStateChange={this._onHandlerStateChange}>
        <Animated.View style={{ transform: [{ rotate: this._rot }] }}>{children}</Animated.View>
      </RotationGestureHandler>
    );
  }
}

export default class Example extends Component<{ style?: StyleProp<ViewStyle> }> {
  render() {
    return (
      <View style={this.props.style}>
        <Snappable>
          <Twistable>
            <View style={styles.box} />
          </Twistable>
        </Snappable>
      </View>
    );
  }
}

const BOX_SIZE = 200;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  box: {
    width: BOX_SIZE,
    height: BOX_SIZE,
    borderColor: '#F5FCFF',
    alignSelf: 'center',
    backgroundColor: 'plum',
  },
});
