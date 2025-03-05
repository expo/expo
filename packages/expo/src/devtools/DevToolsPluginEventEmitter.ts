export interface EventSubscription {
  listener: Function;
  context: any;
  remove(): void;
}

export class DevToolsPluginEventEmitter {
  private _currentListener: EventSubscription | undefined;
  private _listeners: Record<string, undefined | Set<EventSubscription>>;

  constructor() {
    this._currentListener = undefined;
    this._listeners = Object.create(null);
  }

  /**
   * Adds a listener to be invoked when events of the specified type are
   * emitted. An optional calling context may be provided. The data arguments
   * emitted will be passed to the listener function.
   */
  addListener(eventType: string, listener: Function, context?: any) {
    if (context) listener = listener.bind(context);
    const subsForType = this._listeners[eventType] || (this._listeners[eventType] = new Set());
    const subscription: EventSubscription = {
      listener,
      context,
      remove: () => {
        this._listeners[eventType]?.delete(subscription);
      },
    };
    subsForType.add(subscription);
    return subscription;
  }

  /**
   * Similar to addListener, except that the listener is removed after it is
   * invoked once.
   */
  once(eventType: string, listener: Function, context?: any): EventSubscription {
    const emitter = this;
    function wrappedListener(...data: any[]) {
      emitter.removeCurrentListener();
      listener.apply(context, data);
    }
    return this.addListener(eventType, wrappedListener, context);
  }

  /**
   * Removes all of the registered listeners, including those registered as
   * listener maps.
   */
  removeAllListeners(eventType?: string): void {
    if (eventType) {
      this._listeners[eventType] = undefined;
    } else {
      this._listeners = Object.create(null);
    }
  }

  /**
   * Provides an API that can be called during an eventing cycle to remove the
   * last listener that was invoked. This allows a developer to provide an event
   * object that can remove the listener (or listener map) during the
   * invocation.
   *
   * If it is called when not inside of an emitting cycle it will throw.
   */
  removeCurrentListener(): void {
    if (this._currentListener) {
      this._currentListener.remove();
    } else {
      throw new Error('Not in an emitting cycle; there is no current subscription');
    }
  }

  /**
   * Returns an array of listeners that are currently registered for the given
   * event.
   */
  listeners(eventType: string): Function[] {
    const listeners: Function[] = [];
    const subsForType = this._listeners[eventType];
    if (subsForType) {
      for (const subscription of subsForType) {
        listeners.push(subscription.listener);
      }
    }
    return listeners;
  }

  /**
   * Emits an event of the given type with the given data. All handlers of that
   * particular type will be notified.
   */
  emit(eventType: string, ...data: any[]): void {
    const subsForType = this._listeners[eventType];
    if (subsForType) {
      for (const subscription of subsForType) {
        const prevCurrentListener = this._currentListener;
        try {
          this._currentListener = subscription;
          subscription.listener(...data);
        } finally {
          this._currentListener = prevCurrentListener;
        }
      }
    }
  }
}
