import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import {
  PanGestureHandler,
  PanGestureHandlerStateChangeEvent,
  PinchGestureHandler,
  PinchGestureHandlerStateChangeEvent,
  RotationGestureHandler,
  RotationGestureHandlerStateChangeEvent,
  State,
} from 'react-native-gesture-handler';

const USE_NATIVE_DRIVER = true;

class PinchableBox extends React.Component {
  panRef = React.createRef<PanGestureHandler>();
  rotationRef = React.createRef<RotationGestureHandler>();
  pinchRef = React.createRef<PinchGestureHandler>();

  _baseScale: Animated.Value;
  _pinchScale: Animated.Value;
  _scale: Animated.AnimatedMultiplication<number>;
  _lastScale: number;
  _onPinchGestureEvent: (...args: any[]) => void;

  _rotate: Animated.Value;
  _rotateStr: Animated.AnimatedInterpolation<number>;
  _lastRotate: number;
  _onRotateGestureEvent?: (...args: any[]) => void;

  _tilt: Animated.Value;
  _tiltStr: Animated.AnimatedInterpolation<number>;
  _lastTilt: number;
  _onTiltGestureEvent: (...args: any[]) => void;

  constructor(props: any) {
    super(props);

    /* Pinching */
    this._baseScale = new Animated.Value(1);
    this._pinchScale = new Animated.Value(1);
    this._scale = Animated.multiply(this._baseScale, this._pinchScale);
    this._lastScale = 1;
    this._onPinchGestureEvent = Animated.event([{ nativeEvent: { scale: this._pinchScale } }], {
      useNativeDriver: USE_NATIVE_DRIVER,
    });

    /* Rotation */
    this._rotate = new Animated.Value(0);
    this._rotateStr = this._rotate.interpolate({
      inputRange: [-100, 100],
      outputRange: ['-100rad', '100rad'],
    });
    this._lastRotate = 0;
    this._onRotateGestureEvent = Animated.event([{ nativeEvent: { rotation: this._rotate } }], {
      useNativeDriver: USE_NATIVE_DRIVER,
    });

    /* Tilt */
    this._tilt = new Animated.Value(0);
    this._tiltStr = this._tilt.interpolate({
      inputRange: [-501, -500, 0, 1],
      outputRange: ['1rad', '1rad', '0rad', '0rad'],
    });
    this._lastTilt = 0;
    this._onTiltGestureEvent = Animated.event([{ nativeEvent: { translationY: this._tilt } }], {
      useNativeDriver: USE_NATIVE_DRIVER,
    });
  }

  _onRotateHandlerStateChange = (event: RotationGestureHandlerStateChangeEvent) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      this._lastRotate += event.nativeEvent.rotation;
      this._rotate.setOffset(this._lastRotate);
      this._rotate.setValue(0);
    }
  };
  _onPinchHandlerStateChange = (event: PinchGestureHandlerStateChangeEvent) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      this._lastScale *= event.nativeEvent.scale;
      this._baseScale.setValue(this._lastScale);
      this._pinchScale.setValue(1);
    }
  };
  _onTiltGestureStateChange = (event: PanGestureHandlerStateChangeEvent) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      this._lastTilt += event.nativeEvent.translationY;
      this._tilt.setOffset(this._lastTilt);
      this._tilt.setValue(0);
    }
  };
  render() {
    return (
      <PanGestureHandler
        ref={this.panRef}
        onGestureEvent={this._onTiltGestureEvent}
        onHandlerStateChange={this._onTiltGestureStateChange}
        minDist={10}
        minPointers={2}
        maxPointers={2}
        avgTouches>
        <Animated.View style={styles.wrapper}>
          <RotationGestureHandler
            ref={this.rotationRef}
            simultaneousHandlers={this.pinchRef}
            onGestureEvent={this._onRotateGestureEvent}
            onHandlerStateChange={this._onRotateHandlerStateChange}>
            <Animated.View style={styles.wrapper}>
              <PinchGestureHandler
                ref={this.pinchRef}
                simultaneousHandlers={this.rotationRef}
                onGestureEvent={this._onPinchGestureEvent}
                onHandlerStateChange={this._onPinchHandlerStateChange}>
                <Animated.View style={styles.container} collapsable={false}>
                  <Animated.Image
                    style={[
                      styles.pinchableImage,
                      {
                        transform: [
                          { perspective: 200 },
                          { scale: this._scale },
                          { rotate: this._rotateStr },
                          { rotateX: this._tiltStr },
                        ],
                      },
                    ]}
                    source={require('../../assets/images/swmansion.png')}
                  />
                </Animated.View>
              </PinchGestureHandler>
            </Animated.View>
          </RotationGestureHandler>
        </Animated.View>
      </PanGestureHandler>
    );
  }
}

const GestureHandlerPinchScreen = () => (
  <View style={{ flex: 1 }}>
    <PinchableBox />
    <PinchableBox />
  </View>
);

GestureHandlerPinchScreen.navigationOptions = {
  title: 'Pinch and Rotate',
};

export default GestureHandlerPinchScreen;

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'black',
    overflow: 'hidden',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  pinchableImage: {
    width: 250,
    height: 250,
  },
  wrapper: {
    flex: 1,
  },
});
