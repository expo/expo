import { MutableRefObject } from 'react';
import { WorkletFunction } from '../commonTypes';
import WorkletEventHandler from '../WorkletEventHandler';
import { Context, DependencyList } from './commonTypes';
import { useEvent, useHandler } from './Hooks';

interface Handler<T, TContext extends Context> extends WorkletFunction {
  (event: T, context: TContext, isCanceledOrFailed?: boolean): void;
}

export interface GestureHandlers<T, TContext extends Context> {
  [key: string]: Handler<T, TContext> | undefined;
  onStart?: Handler<T, TContext>;
  onActive?: Handler<T, TContext>;
  onEnd?: Handler<T, TContext>;
  onFail?: Handler<T, TContext>;
  onCancel?: Handler<T, TContext>;
  onFinish?: Handler<T, TContext>;
}

export enum EventType {
  UNDETERMINED = 0,
  FAILED,
  BEGAN,
  CANCELLED,
  ACTIVE,
  END,
}

export interface GestureHandlerStateChangeNativeEvent {
  handlerTag: number;
  numberOfPointers: number;
  state: EventType;
  oldState: EventType;
}

export interface GestureHandlerEvent<T>
  extends GestureHandlerStateChangeNativeEvent {
  nativeEvent: T;
}

export function useAnimatedGestureHandler<
  T extends GestureHandlerEvent<T>,
  TContext extends Context
>(
  handlers: GestureHandlers<T, TContext>,
  dependencies?: DependencyList
): MutableRefObject<WorkletEventHandler<T> | null> | ((e: T) => void) {
  const { context, doDependenciesDiffer, useWeb } = useHandler<T, TContext>(
    handlers,
    dependencies
  );

  const handler = (e: T) => {
    'worklet';
    const event = useWeb ? e.nativeEvent : e;

    if (event.state === EventType.BEGAN && handlers.onStart) {
      handlers.onStart(event, context);
    }
    if (event.state === EventType.ACTIVE && handlers.onActive) {
      handlers.onActive(event, context);
    }
    if (
      event.oldState === EventType.ACTIVE &&
      event.state === EventType.END &&
      handlers.onEnd
    ) {
      handlers.onEnd(event, context);
    }
    if (
      event.oldState === EventType.BEGAN &&
      event.state === EventType.FAILED &&
      handlers.onFail
    ) {
      handlers.onFail(event, context);
    }
    if (
      event.oldState === EventType.ACTIVE &&
      event.state === EventType.CANCELLED &&
      handlers.onCancel
    ) {
      handlers.onCancel(event, context);
    }
    if (
      (event.oldState === EventType.BEGAN ||
        event.oldState === EventType.ACTIVE) &&
      event.state !== EventType.BEGAN &&
      event.state !== EventType.ACTIVE &&
      handlers.onFinish
    ) {
      handlers.onFinish(
        event,
        context,
        event.state === EventType.CANCELLED || event.state === EventType.FAILED
      );
    }
  };

  if (useWeb) {
    return handler;
  }

  return useEvent<T>(
    handler,
    ['onGestureHandlerStateChange', 'onGestureHandlerEvent'],
    doDependenciesDiffer
  );
}
