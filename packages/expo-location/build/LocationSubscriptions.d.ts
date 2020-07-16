import { EventEmitter } from '@unimodules/core';
import { LocationCallback, LocationHeadingCallback } from './Location.types';
export declare const LocationEventEmitter: EventEmitter;
declare class Subscriber<CallbackType extends LocationCallback | LocationHeadingCallback> {
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
     * Unregisters a callback with given id and revokes the subscription if possible.
     */
    unregisterCallback(id: number): void;
}
export declare const LocationSubscriber: Subscriber<LocationCallback>;
export declare const HeadingSubscriber: Subscriber<LocationHeadingCallback>;
/**
 * Necessary for some unit tests.
 */
export declare function _getCurrentWatchId(): number;
export {};
