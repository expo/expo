import { DeviceEventEmitter, EmitterSubscription } from 'react-native';
import { State } from '../../State';
import { EventType } from '../../EventType';
import {
  GestureTouchEvent,
  GestureUpdateEvent,
  GestureStateChangeEvent,
} from '../gestureHandlerCommon';
import { GestureStateManagerType } from './gestureStateManager';
import { findHandler } from '../handlersRegistry';
import { BaseGesture } from './gesture';

let gestureHandlerEventSubscription: EmitterSubscription | null = null;
let gestureHandlerStateChangeEventSubscription: EmitterSubscription | null = null;

const dummyStateManager: GestureStateManagerType = {
  begin: () => {
    console.warn(
      'You have to use react-native-reanimated in order to control the state of the gesture.'
    );
  },
  activate: () => {
    console.warn(
      'You have to use react-native-reanimated in order to control the state of the gesture.'
    );
  },
  end: () => {
    console.warn(
      'You have to use react-native-reanimated in order to control the state of the gesture.'
    );
  },
  fail: () => {
    console.warn(
      'You have to use react-native-reanimated in order to control the state of the gesture.'
    );
  },
};

const lastUpdateEvent: (GestureUpdateEvent | undefined)[] = [];

function isStateChangeEvent(
  event: GestureUpdateEvent | GestureStateChangeEvent | GestureTouchEvent
): event is GestureStateChangeEvent {
  // @ts-ignore oldState doesn't exist on GestureTouchEvent and that's the point
  return event.oldState != null;
}

function isTouchEvent(
  event: GestureUpdateEvent | GestureStateChangeEvent | GestureTouchEvent
): event is GestureTouchEvent {
  return event.eventType != null;
}

function onGestureHandlerEvent(
  event: GestureUpdateEvent | GestureStateChangeEvent | GestureTouchEvent
) {
  const handler = findHandler(event.handlerTag) as BaseGesture<
    Record<string, unknown>
  >;

  if (handler) {
    if (isStateChangeEvent(event)) {
      if (
        event.oldState === State.UNDETERMINED &&
        event.state === State.BEGAN
      ) {
        handler.handlers.onBegin?.(event);
      } else if (
        (event.oldState === State.BEGAN ||
          event.oldState === State.UNDETERMINED) &&
        event.state === State.ACTIVE
      ) {
        handler.handlers.onStart?.(event);
        lastUpdateEvent[handler.handlers.handlerTag] = event;
      } else if (event.oldState !== event.state && event.state === State.END) {
        if (event.oldState === State.ACTIVE) {
          handler.handlers.onEnd?.(event, true);
        }
        handler.handlers.onFinalize?.(event, true);
        lastUpdateEvent[handler.handlers.handlerTag] = undefined;
      } else if (
        (event.state === State.FAILED || event.state === State.CANCELLED) &&
        event.oldState !== event.state
      ) {
        if (event.oldState === State.ACTIVE) {
          handler.handlers.onEnd?.(event, false);
        }
        handler.handlers.onFinalize?.(event, false);
        lastUpdateEvent[handler.handlers.handlerTag] = undefined;
      }
    } else if (isTouchEvent(event)) {
      switch (event.eventType) {
        case EventType.TOUCHES_DOWN:
          handler.handlers?.onTouchesDown?.(event, dummyStateManager);
          break;
        case EventType.TOUCHES_MOVE:
          handler.handlers?.onTouchesMove?.(event, dummyStateManager);
          break;
        case EventType.TOUCHES_UP:
          handler.handlers?.onTouchesUp?.(event, dummyStateManager);
          break;
        case EventType.TOUCHES_CANCELLED:
          handler.handlers?.onTouchesCancelled?.(event, dummyStateManager);
          break;
      }
    } else {
      handler.handlers.onUpdate?.(event);

      if (handler.handlers.onChange && handler.handlers.changeEventCalculator) {
        handler.handlers.onChange?.(
          handler.handlers.changeEventCalculator?.(
            event,
            lastUpdateEvent[handler.handlers.handlerTag]
          )
        );

        lastUpdateEvent[handler.handlers.handlerTag] = event;
      }
    }
  }
}

export function startListening() {
  stopListening();

  gestureHandlerEventSubscription = DeviceEventEmitter.addListener(
    'onGestureHandlerEvent',
    onGestureHandlerEvent
  );

  gestureHandlerStateChangeEventSubscription = DeviceEventEmitter.addListener(
    'onGestureHandlerStateChange',
    onGestureHandlerEvent
  );
}

export function stopListening() {
  if (gestureHandlerEventSubscription) {
    DeviceEventEmitter.removeSubscription(gestureHandlerEventSubscription);

    gestureHandlerEventSubscription = null;
  }

  if (gestureHandlerStateChangeEventSubscription) {
    DeviceEventEmitter.removeSubscription(
      gestureHandlerStateChangeEventSubscription
    );

    gestureHandlerStateChangeEventSubscription = null;
  }
}
