import { LocationCallback, LocationErrorCallback, LocationHeadingCallback } from './Location.types';
type EventObject = {
    watchId: number;
    [key: string]: any;
};
declare class Subscriber<CallbackType extends LocationCallback | LocationHeadingCallback | LocationErrorCallback> {
    private eventName;
    private eventDataField;
    private callbacks;
    private eventSubscription;
    constructor(eventName: string, eventDataField: string);
    maybeInitializeSubscription(): void;
    /**
     * Registers given callback under new id which is then returned.
     */
    registerCallback(callback: CallbackType): number;
    /**
     * Registers given callback under and existing id. This can be used to
     * create a subscriber for the error event on the same id as the location
     * event is subscribed to.
     */
    registerCallbackForId(watchId: number, callback: CallbackType): number;
    /**
     * Unregisters a callback with given id and revokes the subscription if possible.
     */
    unregisterCallback(id: number): void;
    trigger(event: EventObject): void;
}
export declare const LocationSubscriber: Subscriber<LocationCallback>;
export declare const HeadingSubscriber: Subscriber<LocationHeadingCallback>;
export declare const LocationErrorSubscriber: Subscriber<LocationErrorCallback>;
/**
 * @private Necessary for some unit tests.
 */
export declare function _getCurrentWatchId(): number;
export {};
//# sourceMappingURL=LocationSubscribers.d.ts.map