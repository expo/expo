// @flow

// Similarily to the DrawerLayout component this deserves to be put in a
// separate repo. Although, keeping it here for the time being will allow us
// to move faster and fix possible issues quicker

import React, { Component } from 'react';
import { Animated, StyleSheet, View, I18nManager } from 'react-native';

import { PanGestureHandler, TapGestureHandler, State } from './GestureHandler';

const DRAG_TOSS = 0.05;

export type PropType = {
  children: any,
  friction: number,
  leftThreshold?: number,
  rightThreshold?: number,
  overshootLeft?: boolean,
  overshootRight?: boolean,
  overshootFriction: number,
  onSwipeableLeftOpen?: Function,
  onSwipeableRightOpen?: Function,
  onSwipeableOpen?: Function,
  onSwipeableClose?: Function,
  onSwipeableLeftWillOpen?: Function,
  onSwipeableRightWillOpen?: Function,
  onSwipeableWillOpen?: Function,
  onSwipeableWillClose?: Function,
  renderLeftActions?: (
    progressAnimatedValue: any,
    dragAnimatedValue: any
  ) => any,
  renderRightActions?: (
    progressAnimatedValue: any,
    dragAnimatedValue: any
  ) => any,
  useNativeAnimations: boolean,
  animationOptions?: Object,
  containerStyle?: Object,
  childrenContainerStyle?: Object,
};
type StateType = {
  dragX: Animated.Value,
  rowTranslation: Animated.Value,
  rowState: number,
  leftWidth: number | typeof undefined,
  rightOffset: number | typeof undefined,
  rowWidth: number | typeof undefined,
};

export default class Swipeable extends Component<PropType, StateType> {
  static defaultProps = {
    friction: 1,
    overshootFriction: 1,
    useNativeAnimations: true,
  };
  _onGestureEvent: ?Animated.Event;
  _transX: ?Animated.Interpolation;
  _showLeftAction: ?Animated.Interpolation | ?Animated.Value;
  _leftActionTranslate: ?Animated.Interpolation;
  _showRightAction: ?Animated.Interpolation | ?Animated.Value;
  _rightActionTranslate: ?Animated.Interpolation;

  constructor(props: PropType) {
    super(props);
    const dragX = new Animated.Value(0);
    this.state = {
      dragX,
      rowTranslation: new Animated.Value(0),
      rowState: 0,
      leftWidth: undefined,
      rightOffset: undefined,
      rowWidth: undefined,
    };
    this._updateAnimatedEvent(props, this.state);

    this._onGestureEvent = Animated.event(
      [{ nativeEvent: { translationX: dragX } }],
      { useNativeDriver: props.useNativeAnimations }
    );
  }

  UNSAFE_componentWillUpdate(props: PropType, state: StateType) {
    if (
      this.props.friction !== props.friction ||
      this.props.overshootLeft !== props.overshootLeft ||
      this.props.overshootRight !== props.overshootRight ||
      this.props.overshootFriction !== props.overshootFriction ||
      this.state.leftWidth !== state.leftWidth ||
      this.state.rightOffset !== state.rightOffset ||
      this.state.rowWidth !== state.rowWidth
    ) {
      this._updateAnimatedEvent(props, state);
    }
  }

  _updateAnimatedEvent = (props: PropType, state: StateType) => {
    const { friction, overshootFriction, useNativeAnimations } = props;
    const { dragX, rowTranslation, leftWidth = 0, rowWidth = 0 } = state;
    const { rightOffset = rowWidth } = state;
    const rightWidth = Math.max(0, rowWidth - rightOffset);

    const {
      overshootLeft = leftWidth > 0,
      overshootRight = rightWidth > 0,
    } = props;

    const transX = Animated.add(
      rowTranslation,
      dragX.interpolate({
        inputRange: [0, friction],
        outputRange: [0, 1],
      })
    ).interpolate({
      inputRange: [
        -rightWidth - (overshootRight ? 1 : overshootFriction),
        -rightWidth,
        leftWidth,
        leftWidth + (overshootLeft ? 1 : overshootFriction),
      ],
      outputRange: [
        -rightWidth - (overshootRight || overshootFriction > 1 ? 1 : 0),
        -rightWidth,
        leftWidth,
        leftWidth + (overshootLeft || overshootFriction > 1 ? 1 : 0),
      ],
    });
    this._transX = transX;
    this._showLeftAction =
      leftWidth > 0
        ? transX.interpolate({
            inputRange: [-1, 0, leftWidth],
            outputRange: [0, 0, 1],
          })
        : new Animated.Value(0);
    this._leftActionTranslate = this._showLeftAction.interpolate({
      inputRange: [0, Number.MIN_VALUE],
      outputRange: [-10000, 0],
      extrapolate: 'clamp',
    });
    this._showRightAction =
      rightWidth > 0
        ? transX.interpolate({
            inputRange: [-rightWidth, 0, 1],
            outputRange: [1, 0, 0],
          })
        : new Animated.Value(0);
    this._rightActionTranslate = this._showRightAction.interpolate({
      inputRange: [0, Number.MIN_VALUE],
      outputRange: [-10000, 0],
      extrapolate: 'clamp',
    });
  };

  _onTapHandlerStateChange = ({ nativeEvent }) => {
    if (nativeEvent.oldState === State.ACTIVE) {
      this.close();
    }
  };

  _onHandlerStateChange = ({ nativeEvent }) => {
    if (nativeEvent.oldState === State.ACTIVE) {
      this._handleRelease(nativeEvent);
    }
  };

  _handleRelease = nativeEvent => {
    const { velocityX, translationX: dragX } = nativeEvent;
    const { leftWidth = 0, rowWidth = 0, rowState } = this.state;
    const { rightOffset = rowWidth } = this.state;
    const rightWidth = rowWidth - rightOffset;
    const {
      friction,
      leftThreshold = leftWidth / 2,
      rightThreshold = rightWidth / 2,
    } = this.props;

    const startOffsetX = this._currentOffset() + dragX / friction;
    const translationX = (dragX + DRAG_TOSS * velocityX) / friction;

    let toValue = 0;
    if (rowState === 0) {
      if (translationX > leftThreshold) {
        toValue = leftWidth;
      } else if (translationX < -rightThreshold) {
        toValue = -rightWidth;
      }
    } else if (rowState === 1) {
      // swiped to left
      if (translationX > -leftThreshold) {
        toValue = leftWidth;
      }
    } else {
      // swiped to right
      if (translationX < rightThreshold) {
        toValue = -rightWidth;
      }
    }

    this._animateRow(startOffsetX, toValue, velocityX / friction);
  };

  _animateRow = (fromValue, toValue, velocityX) => {
    const { dragX, rowTranslation } = this.state;
    dragX.setValue(0);
    rowTranslation.setValue(fromValue);

    this.setState({ rowState: Math.sign(toValue) });
    Animated.spring(rowTranslation, {
      restSpeedThreshold: 1.7,
      restDisplacementThreshold: 0.4,
      velocity: velocityX,
      bounciness: 0,
      toValue,
      useNativeDriver: this.props.useNativeAnimations,
      ...this.props.animationOptions,
    }).start(({ finished }) => {
      if (finished) {
        if (toValue > 0 && this.props.onSwipeableLeftOpen) {
          this.props.onSwipeableLeftOpen();
        } else if (toValue < 0 && this.props.onSwipeableRightOpen) {
          this.props.onSwipeableRightOpen();
        }

        if (toValue === 0) {
          this.props.onSwipeableClose && this.props.onSwipeableClose();
        } else {
          this.props.onSwipeableOpen && this.props.onSwipeableOpen();
        }
      }
    });
    if (toValue > 0 && this.props.onSwipeableLeftWillOpen) {
      this.props.onSwipeableLeftWillOpen();
    } else if (toValue < 0 && this.props.onSwipeableRightWillOpen) {
      this.props.onSwipeableRightWillOpen();
    }

    if (toValue === 0) {
      this.props.onSwipeableWillClose && this.props.onSwipeableWillClose();
    } else {
      this.props.onSwipeableWillOpen && this.props.onSwipeableWillOpen();
    }
  };

  _onRowLayout = ({ nativeEvent }) => {
    this.setState({ rowWidth: nativeEvent.layout.width });
  };

  _currentOffset = () => {
    const { leftWidth = 0, rowWidth = 0, rowState } = this.state;
    const { rightOffset = rowWidth } = this.state;
    const rightWidth = rowWidth - rightOffset;
    if (rowState === 1) {
      return leftWidth;
    } else if (rowState === -1) {
      return -rightWidth;
    }
    return 0;
  };

  close = () => {
    this._animateRow(this._currentOffset(), 0);
  };

  openLeft = () => {
    const { leftWidth = 0 } = this.state;
    this._animateRow(this._currentOffset(), leftWidth);
  };

  openRight = () => {
    const { rowWidth = 0 } = this.state;
    const { rightOffset = rowWidth } = this.state;
    const rightWidth = rowWidth - rightOffset;
    this._animateRow(this._currentOffset(), -rightWidth);
  };

  render() {
    const { rowState } = this.state;
    const { children, renderLeftActions, renderRightActions } = this.props;

    const left = renderLeftActions && (
      <Animated.View
        style={[
          styles.leftActions,
          { transform: [{ translateX: this._leftActionTranslate }] },
        ]}>
        {renderLeftActions(this._showLeftAction, this._transX)}
        <View
          onLayout={({ nativeEvent }) =>
            this.setState({ leftWidth: nativeEvent.layout.x })
          }
        />
      </Animated.View>
    );

    const right = renderRightActions && (
      <Animated.View
        style={[
          styles.rightActions,
          { transform: [{ translateX: this._rightActionTranslate }] },
        ]}>
        {renderRightActions(this._showRightAction, this._transX)}
        <View
          onLayout={({ nativeEvent }) =>
            this.setState({ rightOffset: nativeEvent.layout.x })
          }
        />
      </Animated.View>
    );

    return (
      <PanGestureHandler
        activeOffsetX={[-10, 10]}
        {...this.props}
        onGestureEvent={this._onGestureEvent}
        onHandlerStateChange={this._onHandlerStateChange}>
        <Animated.View
          onLayout={this._onRowLayout}
          style={[styles.container, this.props.containerStyle]}>
          {left}
          {right}
          <TapGestureHandler
            enabled={rowState !== 0}
            onHandlerStateChange={this._onTapHandlerStateChange}>
            <Animated.View
              pointerEvents={rowState === 0 ? 'auto' : 'box-only'}
              style={[
                {
                  transform: [{ translateX: this._transX }],
                },
                this.props.childrenContainerStyle,
              ]}>
              {children}
            </Animated.View>
          </TapGestureHandler>
        </Animated.View>
      </PanGestureHandler>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  leftActions: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: I18nManager.isRTL? 'row-reverse': 'row',
  },
  rightActions: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
  },
});
