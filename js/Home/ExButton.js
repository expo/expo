/**
 * @providesModule ExButton
 */
'use strict';

import React, { PropTypes } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  PanResponder,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import TimerMixin from 'react-timer-mixin';
import ResponsiveImage from '@exponent/react-native-responsive-image';

import autobind from 'autobind-decorator';
import reactMixin from 'react-mixin';
import { connect } from 'react-redux';

import ExLayout from 'ExLayout';

let AnimatedResponsiveImage = Animated.createAnimatedComponent(ResponsiveImage);

const BubbleSize = 44;
const BubbleHitTestSlop = 10;

// TODO(brentvatne): Take into account screen rotations, will need to put this
// into state or a container component
let DeviceWidth = Dimensions.get('window').width;
let DeviceHeight = Dimensions.get('window').height;
let LeftDock = 3;
let RightDock = DeviceWidth - BubbleSize - 3;
let ScreenCenter = DeviceWidth / 2;

// TODO(brentvatne): Don't move the bubble immediately, wait maybe half a
// second or so first before tracking (this will require moving away from
// Animated.event)

// TODO(brentvatne): Move away from getValue() if possible

class ExButton extends React.Component {

  static getDataProps(data) {
    return {
      isVisible: data.exponentButton.isVisible,
    };
  }

  static propTypes = {
    /**
     * `speed` property that is passed into spring animations
     */
    speed: PropTypes.number,

    /**
     * `bounciness` property that is passed into spring animations
     */
    bounciness: PropTypes.number,

    /**
     * Multiply the vx and vy on gesture release by this factor
     */
    velocityMultiplier: PropTypes.number,

    /**
     * An additional factor to multiply the vy to correct for the device
     * being taller than it is wide
     */
    extraVelocityMultiplierY: PropTypes.number,

    /**
     * The minimum vx required to throw the bubble to another dock, without
     * having to cross the distance threshold
     */
    velocityThreshold: PropTypes.number,

    /**
     * The lowest on the screen that the bubble settles is:
     * bottom of the screen - `bottomDockDistance`
     */
    bottomDockDistance: PropTypes.number,

    /**
     * The highest on the screen that the bubble settles is:
     * top of the screen + `topDockDistance`
     */
    topDockDistance: PropTypes.number,

    /**
     * The number of milliseconds to wait before becoming inactive after a
     * touch.
     */
    msUntilInactiveOnInteraction: PropTypes.number,

    /**
     * The number of milliseconds to wait before becoming inactive after the
     * mounting the button.
     */
    msUntilInactiveOnMount: PropTypes.number,
  };

  static defaultProps = {
    speed: 2.5,
    bounciness: 2,
    velocityMultiplier: 780,
    extraVelocityMultiplierY: 1.25,
    velocityThreshold: 0.7,
    bottomDockDistance: BubbleSize + 3,
    topDockDistance: 23,
    msUntilInactiveOnMount: 4000,
    msUntilInactiveOnInteraction: 1000,
  };

  constructor(props, context) {
    super(props, context);

    let position = new Animated.ValueXY({
      x: RightDock,
      y: DeviceHeight - props.bottomDockDistance,
    });
    position.setOffset({ x: -BubbleHitTestSlop, y: -BubbleHitTestSlop });

    let panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: this._handlePanResponderGrant,
      onPanResponderMove: Animated.event(
        [null, { dx: position.x, dy: position.y }],
        { listener: this._handlePanResponderMove }
      ),
      onPanResponderRelease: this._handlePanResponderRelease,
      onPanResponderTerminate: this._handlePanResponderRelease,
    });

    this.state = {
      scale: new Animated.Value(1),
      active: new Animated.Value(1),
      position,
      panResponder,
    };
  }

  componentDidMount() {
    this.setTimeout(() => {
      this._becomeInactiveSoon();
    }, this.props.msUntilInactiveOnMount);
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.isVisible && !nextProps.isVisible) {
      Animated.timing(this.state.scale, {
        toValue: 0,
        duration: 250,
        easing: Easing.inOut(Easing.linear),
      }).start();
    } else if (!this.props.isVisible && nextProps.isVisible) {
      Animated.timing(this.state.scale, {
        toValue: 1,
        duration: 250,
        easing: Easing.inOut(Easing.linear),
      }).start();
    }
  }

  render() {
    let { position, scale, active, panResponder } = this.state;

    let tintColor = active.interpolate({
      inputRange: [0, 1],
      outputRange: ['rgba(222,222,222,1)', '#1272b6'],
    });

    let animatedContainerStyle = {
      top: position.y,
      left: position.x,
      transform: [
        { scaleX: scale },
        { scaleY: scale },
      ],
    };

    let bubbleBorderColor = active.interpolate({
      inputRange: [0, 1],
      outputRange: ['rgba(222, 222, 222, 0.85)', 'rgba(18, 114, 182, 0.5)'],
    });

    let bubbleBackgroundColor = active.interpolate({
      inputRange: [0, 1],
      outputRange: ['rgba(255,255,255,0.85)', 'rgba(255,255,255,1)'],
    });

    let shadowOpacity = active.interpolate({
      inputRange: [0, 1],
      outputRange: [0.05, 0.2],
    });

    let animatedBubbleStyle = {
      borderColor: bubbleBorderColor,
      backgroundColor: bubbleBackgroundColor,
      shadowOpacity,
    };

    return (
      <Animated.View
        {...panResponder.panHandlers}
        accessibilityLabel="Home"
        accessibilityTraits="button"
        shouldRasterizeIOS
        style={[styles.container, animatedContainerStyle, this.props.style]}>
        <Animated.View style={[styles.bubble, animatedBubbleStyle]}>
          <AnimatedResponsiveImage
            sources={{
              2: {uri: 'https://s3.amazonaws.com/exp-us-standard/ios-home-btn-logo@2x.png'},
              3: {uri: 'https://s3.amazonaws.com/exp-us-standard/ios-home-btn-logo@3x.png'},
            }}
            style={[styles.icon, {tintColor}]}
          />
        </Animated.View>
      </Animated.View>
    );
  }

  _interactionHasStarted() {
    this.clearTimeout(this._inactiveWait);

    Animated.timing(this.state.active, {
      easing: Easing.inOut(Easing.linear),
      toValue: 1,
      duration: 200,
    }).start();
  }

  _becomeInactiveSoon() {
    this.clearTimeout(this._inactiveWait);

    this._inactiveWait = this.setTimeout(() => {
      Animated.timing(this.state.active, {
        easing: Easing.out(Easing.quad),
        toValue: 0,
        duration: 300,
      }).start();
    }, this.props.msUntilInactiveOnInteraction);
  }

  @autobind
  _handlePanResponderGrant(event, gestureState) {
    var { position } = this.state;

    // Re-set the offset to the current value, otherwise when we set the value
    // again based off of dx and dy that will be relative to the newest gesture
    // and it will appear to jump
    position.setOffset({
      x: position.x.__getValue(),
      y: position.y.__getValue(),
    });
    position.setValue({x: 0, y: 0});

    this._interactionHasStarted();
    Animated.spring(this.state.scale, { toValue: 0.9 }).start();
  }

  @autobind
  _handlePanResponderMove(event, {dx, dy}) {
  }

  @autobind
  _handlePanResponderRelease(event, gestureState) {
    let { dx, dy, vx, vy } = gestureState;
    let { position } = this.state;
    const { velocityThreshold, bottomDockDistance, topDockDistance,
            velocityMultiplier, extraVelocityMultiplierY } = this.props;

    this._becomeInactiveSoon();

    position.flattenOffset();
    Animated.spring(this.state.scale, { toValue: 1 }).start();

    // Exit early if we haven't moved a lot
    let distance = Math.sqrt(dx * dx + dy * dy);
    let threshold = Platform.OS === 'android' ? 6 : 2;
    if (distance <= threshold) {
      if (this.props.isVisible && this.props.onPress) {
        return this.props.onPress(event);
      }
    }

    /* Calculate the X position */
    let currentX = position.x.__getValue();
    let targetX;
    if (currentX >= ScreenCenter && vx > -velocityThreshold ||
        vx >= velocityThreshold) {
      targetX = RightDock;
    } else {
      targetX = LeftDock;
    }

    /* Calculate the Y position */
    let currentY = position.y.__getValue();
    let targetY = Math.abs(vy * dy);

    if (gestureState.vy > 0) {
      targetY = targetY + currentY;
    } else {
      targetY = currentY - targetY;
    }

    if (targetY > DeviceHeight - bottomDockDistance) {
      targetY = DeviceHeight - bottomDockDistance;
    } else if (targetY < topDockDistance) {
      targetY = topDockDistance;
    }

    let springConfig = {bounciness: this.props.bounciness, speed: this.props.speed};

    Animated.parallel([
      Animated.spring(position.x, {
        toValue: targetX - BubbleHitTestSlop,
        ...springConfig,
        velocity: gestureState.vx * velocityMultiplier,
      }),
      Animated.spring(position.y, {
        toValue: targetY - BubbleHitTestSlop,
        ...springConfig,
        velocity: vy * velocityMultiplier * extraVelocityMultiplierY,
      }),
    ]).start();
  }
}

reactMixin(ExButton.prototype, TimerMixin);

export default connect(
  data => ExButton.getDataProps(data),
)(ExButton);

var styles = StyleSheet.create({
  container: {
    position: 'absolute',
    padding: BubbleHitTestSlop,
    backgroundColor: 'transparent',
  },
  bubble: {
    height: BubbleSize,
    width: BubbleSize,
    borderRadius: BubbleSize / 2,
    borderWidth: ExLayout.pixel * 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: 24,
    height: 21,
    backgroundColor: 'transparent',
  },
});
