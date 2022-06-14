import React, { useEffect, useRef } from 'react';
import {
  GestureType,
  HandlerCallbacks,
  BaseGesture,
  GestureRef,
  CALLBACK_TYPE,
} from './gesture';
import { Reanimated, SharedValue } from './reanimatedWrapper';
import { registerHandler, unregisterHandler } from '../handlersRegistry';
import RNGestureHandlerModule from '../../RNGestureHandlerModule';
import {
  baseGestureHandlerWithMonitorProps,
  filterConfig,
  findNodeHandle,
  GestureTouchEvent,
  GestureUpdateEvent,
  GestureStateChangeEvent,
} from '../gestureHandlerCommon';
import {
  GestureStateManager,
  GestureStateManagerType,
} from './gestureStateManager';
import { flingGestureHandlerProps } from '../FlingGestureHandler';
import { forceTouchGestureHandlerProps } from '../ForceTouchGestureHandler';
import { longPressGestureHandlerProps } from '../LongPressGestureHandler';
import {
  panGestureHandlerProps,
  panGestureHandlerCustomNativeProps,
} from '../PanGestureHandler';
import { tapGestureHandlerProps } from '../TapGestureHandler';
import { State } from '../../State';
import { EventType } from '../../EventType';
import { ComposedGesture } from './gestureComposition';

const ALLOWED_PROPS = [
  ...baseGestureHandlerWithMonitorProps,
  ...tapGestureHandlerProps,
  ...panGestureHandlerProps,
  ...panGestureHandlerCustomNativeProps,
  ...longPressGestureHandlerProps,
  ...forceTouchGestureHandlerProps,
  ...flingGestureHandlerProps,
];

export type GestureConfigReference = {
  config: GestureType[];
  animatedEventHandler: unknown;
  animatedHandlers: SharedValue<
    HandlerCallbacks<Record<string, unknown>>[] | null
  > | null;
  firstExecution: boolean;
  useAnimated: boolean;
};

function convertToHandlerTag(ref: GestureRef): number {
  if (typeof ref === 'number') {
    return ref;
  } else if (ref instanceof BaseGesture) {
    return ref.handlerTag;
  } else {
    // @ts-ignore in this case it should be a ref either to gesture object or
    // a gesture handler component, in both cases handlerTag property exists
    return ref.current?.handlerTag ?? -1;
  }
}

function extractValidHandlerTags(interactionGroup: GestureRef[] | undefined) {
  return (
    interactionGroup?.map(convertToHandlerTag)?.filter((tag) => tag > 0) ?? []
  );
}

function dropHandlers(preparedGesture: GestureConfigReference) {
  for (const handler of preparedGesture.config) {
    RNGestureHandlerModule.dropGestureHandler(handler.handlerTag);

    unregisterHandler(handler.handlerTag);
  }
}

interface AttachHandlersConfig {
  preparedGesture: GestureConfigReference;
  gestureConfig: ComposedGesture | GestureType | undefined;
  gesture: GestureType[];
  viewTag: number;
  useAnimated: boolean;
}

function attachHandlers({
  preparedGesture,
  gestureConfig,
  gesture,
  viewTag,
  useAnimated,
}: AttachHandlersConfig) {
  if (!preparedGesture.firstExecution) {
    gestureConfig?.initialize();
  } else {
    preparedGesture.firstExecution = false;
  }

  // use setImmediate to extract handlerTags, because all refs should be initialized
  // when it's ran
  setImmediate(() => {
    gestureConfig?.prepare();
  });

  for (const handler of gesture) {
    RNGestureHandlerModule.createGestureHandler(
      handler.handlerName,
      handler.handlerTag,
      filterConfig(handler.config, ALLOWED_PROPS)
    );

    registerHandler(handler.handlerTag, handler);

    // use setImmediate to extract handlerTags, because all refs should be initialized
    // when it's ran
    setImmediate(() => {
      let requireToFail: number[] = [];
      if (handler.config.requireToFail) {
        requireToFail = extractValidHandlerTags(handler.config.requireToFail);
      }

      let simultaneousWith: number[] = [];
      if (handler.config.simultaneousWith) {
        simultaneousWith = extractValidHandlerTags(
          handler.config.simultaneousWith
        );
      }

      RNGestureHandlerModule.updateGestureHandler(
        handler.handlerTag,
        filterConfig(handler.config, ALLOWED_PROPS, {
          simultaneousHandlers: simultaneousWith,
          waitFor: requireToFail,
        })
      );
    });
  }
  preparedGesture.config = gesture;

  for (const gesture of preparedGesture.config) {
    RNGestureHandlerModule.attachGestureHandler(
      gesture.handlerTag,
      viewTag,
      !useAnimated // send direct events when using animatedGesture, device events otherwise
    );
  }

  if (preparedGesture.animatedHandlers) {
    preparedGesture.animatedHandlers.value = (gesture.map(
      (g) => g.handlers
    ) as unknown) as HandlerCallbacks<Record<string, unknown>>[];
  }
}

function updateHandlers(
  preparedGesture: GestureConfigReference,
  gestureConfig: ComposedGesture | GestureType | undefined,
  gesture: GestureType[]
) {
  gestureConfig?.prepare();

  for (let i = 0; i < gesture.length; i++) {
    const handler = preparedGesture.config[i];

    gesture[i].handlerTag = handler.handlerTag;
    gesture[i].handlers.handlerTag = handler.handlerTag;
  }

  // use setImmediate to extract handlerTags, because when it's ran, all refs should be updated
  // and handlerTags in BaseGesture references should be updated in the loop above (we need to wait
  // in case of external relations)
  setImmediate(() => {
    for (let i = 0; i < gesture.length; i++) {
      const handler = preparedGesture.config[i];

      handler.config = gesture[i].config;
      handler.handlers = gesture[i].handlers;
      handler.handlers.handlerTag = handler.handlerTag;

      const requireToFail = extractValidHandlerTags(
        handler.config.requireToFail
      );

      const simultaneousWith = extractValidHandlerTags(
        handler.config.simultaneousWith
      );

      RNGestureHandlerModule.updateGestureHandler(
        handler.handlerTag,
        filterConfig(handler.config, ALLOWED_PROPS, {
          simultaneousHandlers: simultaneousWith,
          waitFor: requireToFail,
        })
      );

      registerHandler(handler.handlerTag, handler);
    }

    if (preparedGesture.animatedHandlers) {
      preparedGesture.animatedHandlers.value = (preparedGesture.config.map(
        (g) => g.handlers
      ) as unknown) as HandlerCallbacks<Record<string, unknown>>[];
    }
  });
}

function needsToReattach(
  preparedGesture: GestureConfigReference,
  gesture: GestureType[]
) {
  if (gesture.length !== preparedGesture.config.length) {
    return true;
  }
  for (let i = 0; i < gesture.length; i++) {
    if (gesture[i].handlerName !== preparedGesture.config[i].handlerName) {
      return true;
    }
  }

  return false;
}

function useAnimatedGesture(preparedGesture: GestureConfigReference) {
  if (!Reanimated) {
    return;
  }

  function isStateChangeEvent(
    event: GestureUpdateEvent | GestureStateChangeEvent | GestureTouchEvent
  ): event is GestureStateChangeEvent {
    'worklet';
    // @ts-ignore Yes, the oldState prop is missing on GestureTouchEvent, that's the point
    return event.oldState != null;
  }

  function isTouchEvent(
    event: GestureUpdateEvent | GestureStateChangeEvent | GestureTouchEvent
  ): event is GestureTouchEvent {
    'worklet';
    return event.eventType != null;
  }

  function getHandler(
    type: CALLBACK_TYPE,
    gesture: HandlerCallbacks<Record<string, unknown>>
  ) {
    'worklet';
    switch (type) {
      case CALLBACK_TYPE.BEGAN:
        return gesture.onBegin;
      case CALLBACK_TYPE.START:
        return gesture.onStart;
      case CALLBACK_TYPE.UPDATE:
        return gesture.onUpdate;
      case CALLBACK_TYPE.CHANGE:
        return gesture.onChange;
      case CALLBACK_TYPE.END:
        return gesture.onEnd;
      case CALLBACK_TYPE.FINALIZE:
        return gesture.onFinalize;
      case CALLBACK_TYPE.TOUCHES_DOWN:
        return gesture.onTouchesDown;
      case CALLBACK_TYPE.TOUCHES_MOVE:
        return gesture.onTouchesMove;
      case CALLBACK_TYPE.TOUCHES_UP:
        return gesture.onTouchesUp;
      case CALLBACK_TYPE.TOUCHES_CANCELLED:
        return gesture.onTouchesCancelled;
    }
  }

  function touchEventTypeToCallbackType(eventType: EventType): CALLBACK_TYPE {
    'worklet';
    switch (eventType) {
      case EventType.TOUCHES_DOWN:
        return CALLBACK_TYPE.TOUCHES_DOWN;
      case EventType.TOUCHES_MOVE:
        return CALLBACK_TYPE.TOUCHES_MOVE;
      case EventType.TOUCHES_UP:
        return CALLBACK_TYPE.TOUCHES_UP;
      case EventType.TOUCHES_CANCELLED:
        return CALLBACK_TYPE.TOUCHES_CANCELLED;
    }
    return CALLBACK_TYPE.UNDEFINED;
  }

  function runWorklet(
    type: CALLBACK_TYPE,
    gesture: HandlerCallbacks<Record<string, unknown>>,
    event: GestureStateChangeEvent | GestureUpdateEvent | GestureTouchEvent,
    ...args: any[]
  ) {
    'worklet';
    const handler = getHandler(type, gesture);
    if (gesture.isWorklet[type]) {
      // @ts-ignore Logic below makes sure the correct event is send to the
      // correct handler.
      handler?.(event, ...args);
    } else if (handler) {
      console.warn('Animated gesture callback must be a worklet');
    }
  }

  // Hooks are called conditionally, but the condition is whether the
  // react-native-reanimated is installed, which shouldn't change while running
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const sharedHandlersCallbacks = Reanimated.useSharedValue<
    HandlerCallbacks<Record<string, unknown>>[] | null
  >(null);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const lastUpdateEvent = Reanimated.useSharedValue<
    (GestureUpdateEvent | undefined)[]
  >([]);

  // not every gesture needs a state controller, init them lazily
  const stateControllers: GestureStateManagerType[] = [];

  const callback = (
    event: GestureStateChangeEvent | GestureUpdateEvent | GestureTouchEvent
  ) => {
    'worklet';

    const currentCallback = sharedHandlersCallbacks.value;
    if (!currentCallback) {
      return;
    }

    for (let i = 0; i < currentCallback.length; i++) {
      const gesture = currentCallback[i];

      if (event.handlerTag === gesture.handlerTag) {
        if (isStateChangeEvent(event)) {
          if (
            event.oldState === State.UNDETERMINED &&
            event.state === State.BEGAN
          ) {
            runWorklet(CALLBACK_TYPE.BEGAN, gesture, event);
          } else if (
            (event.oldState === State.BEGAN ||
              event.oldState === State.UNDETERMINED) &&
            event.state === State.ACTIVE
          ) {
            runWorklet(CALLBACK_TYPE.START, gesture, event);
            lastUpdateEvent.value[gesture.handlerTag] = undefined;
          } else if (
            event.oldState !== event.state &&
            event.state === State.END
          ) {
            if (event.oldState === State.ACTIVE) {
              runWorklet(CALLBACK_TYPE.END, gesture, event, true);
            }
            runWorklet(CALLBACK_TYPE.FINALIZE, gesture, event, true);
          } else if (
            (event.state === State.FAILED || event.state === State.CANCELLED) &&
            event.state !== event.oldState
          ) {
            if (event.oldState === State.ACTIVE) {
              runWorklet(CALLBACK_TYPE.END, gesture, event, false);
            }
            runWorklet(CALLBACK_TYPE.FINALIZE, gesture, event, false);
          }
        } else if (isTouchEvent(event)) {
          if (!stateControllers[i]) {
            stateControllers[i] = GestureStateManager.create(event.handlerTag);
          }

          if (event.eventType !== EventType.UNDETERMINED) {
            runWorklet(
              touchEventTypeToCallbackType(event.eventType),
              gesture,
              event,
              stateControllers[i]
            );
          }
        } else {
          runWorklet(CALLBACK_TYPE.UPDATE, gesture, event);

          if (gesture.onChange && gesture.changeEventCalculator) {
            runWorklet(
              CALLBACK_TYPE.CHANGE,
              gesture,
              gesture.changeEventCalculator?.(
                event,
                lastUpdateEvent.value[gesture.handlerTag]
              )
            );

            lastUpdateEvent.value[gesture.handlerTag] = event;
          }
        }
      }
    }
  };

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const event = Reanimated.useEvent(
    callback,
    ['onGestureHandlerStateChange', 'onGestureHandlerEvent'],
    true
  );

  preparedGesture.animatedEventHandler = event;
  preparedGesture.animatedHandlers = sharedHandlersCallbacks;
}

interface GestureDetectorProps {
  gesture?: ComposedGesture | GestureType;
}
export const GestureDetector: React.FunctionComponent<GestureDetectorProps> = (
  props
) => {
  const gestureConfig = props.gesture;
  const gesture = gestureConfig?.toGestureArray?.() ?? [];
  const useAnimated =
    gesture.find((gesture) =>
      gesture.handlers.isWorklet.reduce((prev, current) => prev || current)
    ) != null;
  const viewRef = useRef(null);
  const firstRenderRef = useRef(true);

  const preparedGesture = React.useRef<GestureConfigReference>({
    config: gesture,
    animatedEventHandler: null,
    animatedHandlers: null,
    firstExecution: true,
    useAnimated: useAnimated,
  }).current;

  if (useAnimated !== preparedGesture.useAnimated) {
    throw new Error(
      'You cannot change whether you are using gesture or animatedGesture while the app is running'
    );
  }

  if (preparedGesture.firstExecution) {
    gestureConfig?.initialize?.();
  }

  if (useAnimated) {
    // Whether animatedGesture or gesture is used shouldn't change
    // during while an app is running
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useAnimatedGesture(preparedGesture);
  }

  useEffect(() => {
    firstRenderRef.current = true;
    const viewTag = findNodeHandle(viewRef.current) as number;
    attachHandlers({
      preparedGesture,
      gestureConfig,
      gesture,
      viewTag,
      useAnimated,
    });

    return () => {
      dropHandlers(preparedGesture);
    };
  }, []);

  useEffect(() => {
    if (!firstRenderRef.current) {
      const viewTag = findNodeHandle(viewRef.current) as number;

      if (needsToReattach(preparedGesture, gesture)) {
        dropHandlers(preparedGesture);
        attachHandlers({
          preparedGesture,
          gestureConfig,
          gesture,
          viewTag,
          useAnimated,
        });
      } else {
        updateHandlers(preparedGesture, gestureConfig, gesture);
      }
    } else {
      firstRenderRef.current = false;
    }
  }, [props]);

  if (useAnimated) {
    return (
      <AnimatedWrap
        ref={viewRef}
        onGestureHandlerEvent={preparedGesture.animatedEventHandler}>
        {props.children}
      </AnimatedWrap>
    );
  } else {
    return <Wrap ref={viewRef}>{props.children}</Wrap>;
  }
};

class Wrap extends React.Component<{ onGestureHandlerEvent?: unknown }> {
  render() {
    // I don't think that fighting with types over such a simple function is worth it
    // The only thing it does is add 'collapsable: false' to the child component
    // to make sure it is in the native view hierarchy so the detector can find
    // correct viewTag to attach to.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const child: any = React.Children.only(this.props.children);

    return React.cloneElement(
      child,
      { collapsable: false },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      child.props.children
    );
  }
}

const AnimatedWrap = Reanimated?.default?.createAnimatedComponent(Wrap) ?? Wrap;
