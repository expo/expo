export interface EventSubscription {
    listener: Function;
    context: any;
    remove(): void;
}
export declare class DevToolsPluginEventEmitter {
    private _currentListener;
    private _listeners;
    constructor();
    /**
     * Adds a listener to be invoked when events of the specified type are
     * emitted. An optional calling context may be provided. The data arguments
     * emitted will be passed to the listener function.
     */
    addListener(eventType: string, listener: Function, context?: any): EventSubscription;
    /**
     * Similar to addListener, except that the listener is removed after it is
     * invoked once.
     */
    once(eventType: string, listener: Function, context?: any): EventSubscription;
    /**
     * Removes all of the registered listeners, including those registered as
     * listener maps.
     */
    removeAllListeners(eventType?: string): void;
    /**
     * Provides an API that can be called during an eventing cycle to remove the
     * last listener that was invoked. This allows a developer to provide an event
     * object that can remove the listener (or listener map) during the
     * invocation.
     *
     * If it is called when not inside of an emitting cycle it will throw.
     */
    removeCurrentListener(): void;
    /**
     * Returns an array of listeners that are currently registered for the given
     * event.
     */
    listeners(eventType: string): Function[];
    /**
     * Emits an event of the given type with the given data. All handlers of that
     * particular type will be notified.
     */
    emit(eventType: string, ...data: any[]): void;
}
//# sourceMappingURL=DevToolsPluginEventEmitter.d.ts.map