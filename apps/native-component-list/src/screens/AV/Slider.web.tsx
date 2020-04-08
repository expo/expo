/**
 * Thanks to Jean Regisser <jean.regisser@gmail.com>
 * Reference: https://github.com/jeanregisser/react-native-slider
 *
 * @providesModule Slider
 */

// @ts-ignore
// tslint:disable max-classes-per-file
import applyNativeMethods from 'react-native-web/dist/modules/applyNativeMethods';
import {
  View,
  StyleSheet,
  Animated,
  PanResponder,
  Easing,
  PanResponderInstance,
  StyleProp,
  ViewStyle,
  LayoutChangeEvent,
  GestureResponderEvent,
  PanResponderGestureState,
} from 'react-native';
// import Rect from './Rect';
import React, { PureComponent } from 'react';

class Rect {
  x: number;
  y: number;
  width: number;
  height: number;

  constructor(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  containsPoint(x: number, y: number) {
    return x >= this.x && y >= this.y && x <= this.x + this.width && y <= this.y + this.height;
  }
}

const TRACK_SIZE = 4;
const THUMB_SIZE = 20;
const THUMB_TOUCH_SIZE = 40;

const DEFAULT_ANIMATION_CONFIGS = {
  spring: {
    friction: 7,
    tension: 100,
  },
  timing: {
    duration: 150,
    easing: Easing.inOut(Easing.ease),
    delay: 0,
  },
};

interface Props {
  /**
   * Set to true to animate values with default 'timing' animation type
   */
  animateTransitions: boolean;

  /**
   * Used to configure the animation parameters.  These are the same parameters in the Animated library.
   */
  animationConfig: object;

  /**
   * Custom Animation type. 'spring' or 'timing'.
   */
  animationType: 'spring' | 'timing';

  /**
   * Set this to true to visually see the thumb touch rect in green.
   */
  debugTouchArea: boolean;

  disabled: boolean;
  maximumTrackTintColor: string;
  maximumValue: number;
  minimumTrackTintColor: string;
  minimumValue: number;
  onSlidingComplete: (value: number) => void;
  onSlidingStart: () => void;
  onValueChange: (value: number) => void;
  step: number;
  style: StyleProp<ViewStyle>;
  testID: string;
  value: number;
}

interface State {
  containerSize: { width: number; height: number };
  trackSize: { width: number; height: number };
  thumbSize: { width: number; height: number };
  allMeasured: boolean;
  value: Animated.Value;
}

class Slider extends PureComponent<Props, State> {
  _panResponder?: PanResponderInstance;
  _previousLeft?: number;
  _store: { [key: string]: { width: number; height: number; [x: string]: any } } = {};

  static defaultProps = {
    value: 0,
    minimumValue: 0,
    maximumValue: 1,
    step: 0,
    minimumTrackTintColor: '#009688',
    maximumTrackTintColor: '#939393',
    debugTouchArea: false,
    animationType: 'timing',
  };

  constructor(props: Props) {
    super(props);
    this.state = {
      containerSize: { width: 0, height: 0 },
      trackSize: { width: 0, height: 0 },
      thumbSize: { width: 0, height: 0 },
      allMeasured: false,
      value: new Animated.Value(props.value),
    };
    this._panResponder = PanResponder.create({
      onStartShouldSetPanResponder: this._handleStartShouldSetPanResponder,
      onMoveShouldSetPanResponder: this._handleMoveShouldSetPanResponder,
      onPanResponderGrant: this._handlePanResponderGrant,
      onPanResponderMove: this._handlePanResponderMove,
      onPanResponderRelease: this._handlePanResponderEnd,
      onPanResponderTerminationRequest: this._handlePanResponderRequestEnd,
      onPanResponderTerminate: this._handlePanResponderEnd,
    });
  }

  componentDidUpdate(prevProps: Props, _prevState: State) {
    if (this.props.value !== prevProps.value) {
      if (this.props.animateTransitions) {
        this._setCurrentValueAnimated(this.props.value);
      } else {
        this._setCurrentValue(this.props.value);
      }
    }
  }

  render() {
    const {
      minimumValue,
      maximumValue,
      minimumTrackTintColor,
      maximumTrackTintColor,
      style,
      debugTouchArea,
      animationType,
      ...other
    } = this.props;
    const { value, containerSize, thumbSize, allMeasured } = this.state;
    const thumbLeft = value.interpolate({
      inputRange: [minimumValue, isNaN(maximumValue) ? minimumValue + 0.1 : maximumValue],
      outputRange: [0, containerSize.width - thumbSize.width],
    });
    const valueVisibleStyle: { opacity?: number } = {};
    if (!allMeasured) {
      valueVisibleStyle.opacity = 0;
    }

    const minimumTrackStyle = {
      position: 'absolute',
      width: Animated.add(thumbLeft, thumbSize.width / 2),
      backgroundColor: minimumTrackTintColor,
      ...valueVisibleStyle,
    };

    const touchOverflowStyle = this._getTouchOverflowStyle();

    return (
      <View {...other} onLayout={this._measureContainer} style={[defaultStyles.container, style]}>
        <View
          onLayout={this._measureTrack}
          style={[{ backgroundColor: maximumTrackTintColor }, defaultStyles.track]}
        />
        <Animated.View style={[defaultStyles.track, minimumTrackStyle]} />
        <Animated.View
          onLayout={this._measureThumb}
          style={[
            { backgroundColor: minimumTrackTintColor },
            defaultStyles.thumb,
            {
              transform: [{ translateX: thumbLeft }, { translateY: 0 }],
              ...valueVisibleStyle,
            },
          ]}
        />
        <View
          style={[defaultStyles.touchArea, touchOverflowStyle]}
          {...this._panResponder!.panHandlers}>
          {debugTouchArea === true && this._renderDebugThumbTouchRect(thumbLeft)}
        </View>
      </View>
    );
  }

  _getPropsForComponentUpdate(props: Props) {
    const { value, onValueChange, onSlidingStart, onSlidingComplete, style, ...otherProps } = props;
    return otherProps;
  }

  _handleStartShouldSetPanResponder = (
    e: GestureResponderEvent,
    gestureState: PanResponderGestureState
  ): boolean => {
    // Should we become active when the user presses down on the thumb?
    return this._thumbHitTest(e);
  };

  _handleMoveShouldSetPanResponder(
    e: GestureResponderEvent,
    gestureState: PanResponderGestureState
  ): boolean {
    // Should we become active when the user moves a touch over the thumb?
    return false;
  }

  _handlePanResponderGrant = (e: GestureResponderEvent, gestureState: PanResponderGestureState) => {
    this._previousLeft = this._getThumbLeft(this._getCurrentValue());
  };

  _handlePanResponderMove = (e: GestureResponderEvent, gestureState: PanResponderGestureState) => {
    if (this.props.disabled) {
      return;
    }

    this._setCurrentValue(this._getValue(gestureState));
    this._fireChangeEvent('onValueChange');
  };

  _handlePanResponderRequestEnd(e: GestureResponderEvent, gestureState: PanResponderGestureState) {
    // Should we allow another component to take over this pan?
    return false;
  }

  _handlePanResponderEnd = (e: GestureResponderEvent, gestureState: PanResponderGestureState) => {
    if (this.props.disabled) {
      return;
    }

    this._setCurrentValue(this._getValue(gestureState));
    this._fireChangeEvent('onSlidingComplete');
  };

  _measureContainer = (x: LayoutChangeEvent) => {
    this._handleMeasure('containerSize', x);
  };

  _measureTrack = (x: LayoutChangeEvent) => {
    this._handleMeasure('trackSize', x);
  };

  _measureThumb = (x: LayoutChangeEvent) => {
    this._handleMeasure('thumbSize', x);
  };

  _handleMeasure = (name: string, x: LayoutChangeEvent) => {
    const { width, height } = x.nativeEvent.layout;
    const size = { width, height };

    const currentSize = this._store[name];
    if (currentSize && width === currentSize.width && height === currentSize.height) {
      return;
    }
    this._store[name] = size;

    const store = this._store;
    if (store.containerSize && store.trackSize && store.thumbSize) {
      this.setState({
        containerSize: store.containerSize,
        trackSize: store.trackSize,
        thumbSize: store.thumbSize,
        allMeasured: true,
      });
    }
  };

  _getRatio = (value: number) => {
    return (value - this.props.minimumValue) / (this.props.maximumValue - this.props.minimumValue);
  };

  _getThumbLeft = (value: number) => {
    const ratio = this._getRatio(value);
    return ratio * (this.state.containerSize.width - this.state.thumbSize.width);
  };

  _getValue = (gestureState: PanResponderGestureState) => {
    const length = this.state.containerSize.width - this.state.thumbSize.width;
    const thumbLeft = this._previousLeft! + gestureState.dx;

    const ratio = thumbLeft / length;

    if (this.props.step) {
      return Math.max(
        this.props.minimumValue,
        Math.min(
          this.props.maximumValue,
          this.props.minimumValue +
            Math.round(
              (ratio * (this.props.maximumValue - this.props.minimumValue)) / this.props.step
            ) *
              this.props.step
        )
      );
    } else {
      return Math.max(
        this.props.minimumValue,
        Math.min(
          this.props.maximumValue,
          ratio * (this.props.maximumValue - this.props.minimumValue) + this.props.minimumValue
        )
      );
    }
  };

  _getCurrentValue = () => {
    // @ts-ignore
    return this.state.value.__getValue();
  };

  _setCurrentValue = (value: number) => {
    this.state.value.setValue(value);
  };

  _setCurrentValueAnimated = (value: number) => {
    const animationType = this.props.animationType;
    const animationConfig = Object.assign(
      {},
      DEFAULT_ANIMATION_CONFIGS[animationType],
      this.props.animationConfig,
      { toValue: value }
    );

    Animated[animationType](this.state.value, animationConfig).start();
  };

  _fireChangeEvent = (event: 'onValueChange' | 'onSlidingComplete') => {
    if (this.props[event]) {
      this.props[event](this._getCurrentValue());
    }
  };

  _getTouchOverflowSize = () => {
    const { allMeasured, thumbSize, containerSize } = this.state;

    const size: { width?: number; height?: number } = {};
    if (allMeasured === true) {
      size.width = Math.max(0, THUMB_TOUCH_SIZE - thumbSize.width);
      size.height = Math.max(0, THUMB_TOUCH_SIZE - containerSize.height);
    }

    return size;
  };

  _getTouchOverflowStyle = () => {
    const { width, height } = this._getTouchOverflowSize();

    const touchOverflowStyle: ViewStyle = {};
    if (width !== undefined && height !== undefined) {
      const verticalMargin = -height / 2;
      touchOverflowStyle.marginTop = verticalMargin;
      touchOverflowStyle.marginBottom = verticalMargin;

      const horizontalMargin = -width / 2;
      touchOverflowStyle.marginLeft = horizontalMargin;
      touchOverflowStyle.marginRight = horizontalMargin;
    }

    if (this.props.debugTouchArea === true) {
      touchOverflowStyle.backgroundColor = 'orange';
      touchOverflowStyle.opacity = 0.5;
    }

    return touchOverflowStyle;
  };

  _thumbHitTest = (e: GestureResponderEvent) => {
    const nativeEvent = e.nativeEvent;
    const thumbTouchRect = this._getThumbTouchRect();
    return thumbTouchRect.containsPoint(nativeEvent.locationX, nativeEvent.locationY);
  };

  _getThumbTouchRect = () => {
    const { thumbSize, containerSize } = this.state;
    const touchOverflowSize = this._getTouchOverflowSize();

    return new Rect(
      touchOverflowSize.width! / 2 +
        this._getThumbLeft(this._getCurrentValue()) +
        (thumbSize.width - THUMB_TOUCH_SIZE) / 2,
      touchOverflowSize.height! / 2 + (containerSize.height - THUMB_TOUCH_SIZE) / 2,
      THUMB_TOUCH_SIZE,
      THUMB_TOUCH_SIZE
    );
  };

  _renderDebugThumbTouchRect = (thumbLeft: Animated.AnimatedInterpolation) => {
    const thumbTouchRect = this._getThumbTouchRect();
    const positionStyle = {
      left: thumbLeft,
      top: thumbTouchRect.y,
      width: thumbTouchRect.width,
      height: thumbTouchRect.height,
    };

    return (
      <Animated.View
        pointerEvents="none"
        style={[defaultStyles.debugThumbTouchArea, positionStyle]}
      />
    );
  };
}

const defaultStyles = StyleSheet.create({
  container: {
    height: 40,
    justifyContent: 'center',
  },
  track: {
    height: TRACK_SIZE,
    borderRadius: TRACK_SIZE / 2,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
  },
  touchArea: {
    position: 'absolute',
    backgroundColor: 'transparent',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  debugThumbTouchArea: {
    position: 'absolute',
    backgroundColor: 'green',
    opacity: 0.5,
  },
});

export default applyNativeMethods(Slider);
