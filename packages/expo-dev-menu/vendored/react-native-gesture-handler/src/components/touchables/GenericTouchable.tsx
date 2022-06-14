import * as React from 'react';
import { Component } from 'react';
import {
  Animated,
  Platform,
  StyleProp,
  ViewStyle,
  TouchableWithoutFeedbackProps,
} from 'react-native';

import { State } from '../../State';
import { BaseButton } from '../GestureButtons';

import {
  GestureEvent,
  HandlerStateChangeEvent,
} from '../../handlers/gestureHandlerCommon';
import { NativeViewGestureHandlerPayload } from '../../handlers/NativeViewGestureHandler';
import { TouchableNativeFeedbackExtraProps } from './TouchableNativeFeedback.android';

/**
 * Each touchable is a states' machine which preforms transitions.
 * On very beginning (and on the very end or recognition) touchable is
 * UNDETERMINED. Then it moves to BEGAN. If touchable recognizes that finger
 * travel outside it transits to special MOVED_OUTSIDE state. Gesture recognition
 * finishes in UNDETERMINED state.
 */
export const TOUCHABLE_STATE = {
  UNDETERMINED: 0,
  BEGAN: 1,
  MOVED_OUTSIDE: 2,
} as const;

type TouchableState = typeof TOUCHABLE_STATE[keyof typeof TOUCHABLE_STATE];

export interface GenericTouchableProps extends TouchableWithoutFeedbackProps {
  // Decided to drop not used fields from RN's implementation.
  // e.g. onBlur and onFocus as well as deprecated props. - TODO: this comment may be unuseful in this moment

  // TODO: in RN these events get native event parameter, which prolly could be used in our implementation too
  onPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  onLongPress?: () => void;

  nativeID?: string;
  shouldActivateOnStart?: boolean;
  disallowInterruption?: boolean;

  containerStyle?: StyleProp<ViewStyle>;
}

interface InternalProps {
  extraButtonProps: TouchableNativeFeedbackExtraProps;
  onStateChange?: (oldState: TouchableState, newState: TouchableState) => void;
}

// TODO: maybe can be better
// TODO: all clearTimeout have ! added, maybe they shouldn't ?
type Timeout = ReturnType<typeof setTimeout> | null | undefined;

/**
 * GenericTouchable is not intented to be used as it is.
 * Should be treated as a source for the rest of touchables
 */

export default class GenericTouchable extends Component<
  GenericTouchableProps & InternalProps
> {
  static defaultProps = {
    delayLongPress: 600,
    extraButtonProps: {
      rippleColor: 'transparent',
      exclusive: true,
    },
  };

  // timeout handlers
  pressInTimeout: Timeout;
  pressOutTimeout: Timeout;
  longPressTimeout: Timeout;

  // This flag is required since recognition of longPress implies not-invoking onPress
  longPressDetected = false;

  pointerInside = true;

  // State of touchable
  STATE: TouchableState = TOUCHABLE_STATE.UNDETERMINED;

  // handlePressIn in called on first touch on traveling inside component.
  // Handles state transition with delay.
  handlePressIn() {
    if (this.props.delayPressIn) {
      this.pressInTimeout = setTimeout(() => {
        this.moveToState(TOUCHABLE_STATE.BEGAN);
        this.pressInTimeout = null;
      }, this.props.delayPressIn);
    } else {
      this.moveToState(TOUCHABLE_STATE.BEGAN);
    }
    if (this.props.onLongPress) {
      const time =
        (this.props.delayPressIn || 0) + (this.props.delayLongPress || 0);
      this.longPressTimeout = setTimeout(this.onLongPressDetected, time);
    }
  }
  // handleMoveOutside in called on traveling outside component.
  // Handles state transition with delay.
  handleMoveOutside() {
    if (this.props.delayPressOut) {
      this.pressOutTimeout =
        this.pressOutTimeout ||
        setTimeout(() => {
          this.moveToState(TOUCHABLE_STATE.MOVED_OUTSIDE);
          this.pressOutTimeout = null;
        }, this.props.delayPressOut);
    } else {
      this.moveToState(TOUCHABLE_STATE.MOVED_OUTSIDE);
    }
  }

  // handleGoToUndetermined transits to UNDETERMINED state with proper delay
  handleGoToUndetermined() {
    clearTimeout(this.pressOutTimeout!); // TODO: maybe it can be undefined
    if (this.props.delayPressOut) {
      this.pressOutTimeout = setTimeout(() => {
        if (this.STATE === TOUCHABLE_STATE.UNDETERMINED) {
          this.moveToState(TOUCHABLE_STATE.BEGAN);
        }
        this.moveToState(TOUCHABLE_STATE.UNDETERMINED);
        this.pressOutTimeout = null;
      }, this.props.delayPressOut);
    } else {
      if (this.STATE === TOUCHABLE_STATE.UNDETERMINED) {
        this.moveToState(TOUCHABLE_STATE.BEGAN);
      }
      this.moveToState(TOUCHABLE_STATE.UNDETERMINED);
    }
  }

  componentDidMount() {
    this.reset();
  }
  // reset timeout to prevent memory leaks.
  reset() {
    this.longPressDetected = false;
    this.pointerInside = true;
    clearTimeout(this.pressInTimeout!);
    clearTimeout(this.pressOutTimeout!);
    clearTimeout(this.longPressTimeout!);
    this.pressOutTimeout = null;
    this.longPressTimeout = null;
    this.pressInTimeout = null;
  }

  // All states' transitions are defined here.
  moveToState(newState: TouchableState) {
    if (newState === this.STATE) {
      // Ignore dummy transitions
      return;
    }
    if (newState === TOUCHABLE_STATE.BEGAN) {
      // First touch and moving inside
      this.props.onPressIn?.();
    } else if (newState === TOUCHABLE_STATE.MOVED_OUTSIDE) {
      // Moving outside
      this.props.onPressOut?.();
    } else if (newState === TOUCHABLE_STATE.UNDETERMINED) {
      // Need to reset each time on transition to UNDETERMINED
      this.reset();
      if (this.STATE === TOUCHABLE_STATE.BEGAN) {
        // ... and if it happens inside button.
        this.props.onPressOut?.();
      }
    }
    // Finally call lister (used by subclasses)
    this.props.onStateChange?.(this.STATE, newState);
    // ... and make transition.
    this.STATE = newState;
  }

  onGestureEvent = ({
    nativeEvent: { pointerInside },
  }: GestureEvent<NativeViewGestureHandlerPayload>) => {
    if (this.pointerInside !== pointerInside) {
      if (pointerInside) {
        this.onMoveIn();
      } else {
        this.onMoveOut();
      }
    }
    this.pointerInside = pointerInside;
  };

  onHandlerStateChange = ({
    nativeEvent,
  }: HandlerStateChangeEvent<NativeViewGestureHandlerPayload>) => {
    const { state } = nativeEvent;
    if (state === State.CANCELLED || state === State.FAILED) {
      // Need to handle case with external cancellation (e.g. by ScrollView)
      this.moveToState(TOUCHABLE_STATE.UNDETERMINED);
    } else if (
      // This platform check is an implication of slightly different behavior of handlers on different platform.
      // And Android "Active" state is achieving on first move of a finger, not on press in.
      // On iOS event on "Began" is not delivered.
      state === (Platform.OS !== 'android' ? State.ACTIVE : State.BEGAN) &&
      this.STATE === TOUCHABLE_STATE.UNDETERMINED
    ) {
      // Moving inside requires
      this.handlePressIn();
    } else if (state === State.END) {
      const shouldCallOnPress =
        !this.longPressDetected &&
        this.STATE !== TOUCHABLE_STATE.MOVED_OUTSIDE &&
        this.pressOutTimeout === null;
      this.handleGoToUndetermined();
      if (shouldCallOnPress) {
        // Calls only inside component whether no long press was called previously
        this.props.onPress?.();
      }
    }
  };

  onLongPressDetected = () => {
    this.longPressDetected = true;
    // checked for in the caller of `onLongPressDetected`, but better to check twice
    this.props.onLongPress?.();
  };

  componentWillUnmount() {
    // to prevent memory leaks
    this.reset();
  }

  onMoveIn() {
    if (this.STATE === TOUCHABLE_STATE.MOVED_OUTSIDE) {
      // This call is not throttled with delays (like in RN's implementation).
      this.moveToState(TOUCHABLE_STATE.BEGAN);
    }
  }

  onMoveOut() {
    // long press should no longer be detected
    clearTimeout(this.longPressTimeout!);
    this.longPressTimeout = null;
    if (this.STATE === TOUCHABLE_STATE.BEGAN) {
      this.handleMoveOutside();
    }
  }

  render() {
    const coreProps = {
      accessible: this.props.accessible !== false,
      accessibilityLabel: this.props.accessibilityLabel,
      accessibilityHint: this.props.accessibilityHint,
      accessibilityRole: this.props.accessibilityRole,
      // TODO: check if changed to no 's' correctly, also removed 2 props that are no longer available: `accessibilityComponentType` and `accessibilityTraits`,
      // would be good to check if it is ok for sure, see: https://github.com/facebook/react-native/issues/24016
      accessibilityState: this.props.accessibilityState,
      nativeID: this.props.nativeID,
      onLayout: this.props.onLayout,
      hitSlop: this.props.hitSlop,
    };

    return (
      <BaseButton
        style={this.props.containerStyle}
        onHandlerStateChange={
          // TODO: not sure if it can be undefined instead of null
          this.props.disabled ? undefined : this.onHandlerStateChange
        }
        onGestureEvent={this.onGestureEvent}
        hitSlop={this.props.hitSlop}
        shouldActivateOnStart={this.props.shouldActivateOnStart}
        disallowInterruption={this.props.disallowInterruption}
        testID={this.props.testID}
        {...this.props.extraButtonProps}>
        <Animated.View {...coreProps} style={this.props.style}>
          {this.props.children}
        </Animated.View>
      </BaseButton>
    );
  }
}
