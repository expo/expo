import { EventEmitter } from '@unimodules/core';
import DataSnapshot from './DataSnapshot';
import DatabaseReference from './Reference';
declare type Listener = (snapshot: DataSnapshot) => any;
declare type Registration = {
    key: string;
    path: string;
    once?: boolean;
    appName: string;
    eventType: string;
    listener: Listener;
    eventRegistrationKey: string;
    dbURL?: string;
    ref: DatabaseReference;
};
/**
 * Internally used to manage firebase database realtime event
 * subscriptions and keep the listeners in sync in js vs native.
 */
declare class SyncTree {
    _nativeEmitter?: EventEmitter;
    _reverseLookup: {
        [key: string]: Registration;
    };
    _tree: {
        [key: string]: {
            [key: string]: {
                [key: string]: Listener;
            };
        };
    };
    constructor();
    /**
     *
     * @param event
     * @private
     */
    _handleSyncEvent(event: any): void;
    /**
     * Routes native database 'on' events to their js equivalent counterpart.
     * If there is no longer any listeners remaining for this event we internally
     * call the native unsub method to prevent further events coming through.
     *
     * @param event
     * @private
     */
    _handleValueEvent(event: any): Promise<any>;
    /**
     * Routes native database query listener cancellation events to their js counterparts.
     *
     * @param event
     * @private
     */
    _handleErrorEvent(event: any): void;
    /**
     * Returns registration information such as appName, ref, path and registration keys.
     *
     * @param registration
     * @return {null}
     */
    getRegistration(registration: string): Registration | null;
    /**
     * Removes all listeners for the specified registration keys.
     *
     * @param registrations
     * @return {number}
     */
    removeListenersForRegistrations(registrations: string | string[]): number;
    /**
     * Removes a specific listener from the specified registrations.
     *
     * @param listener
     * @param registrations
     * @return {Array} array of registrations removed
     */
    removeListenerRegistrations(listener: () => any, registrations: string[]): any[];
    /**
     * Returns an array of all registration keys for the specified path.
     *
     * @param path
     * @return {Array}
     */
    getRegistrationsByPath(path: string): string[];
    /**
     * Returns an array of all registration keys for the specified path and eventType.
     *
     * @param path
     * @param eventType
     * @return {Array}
     */
    getRegistrationsByPathEvent(path: string, eventType: string): string[];
    /**
     * Returns a single registration key for the specified path, eventType, and listener
     *
     * @param path
     * @param eventType
     * @param listener
     * @return {Array}
     */
    getOneByPathEventListener(path: string, eventType: string, listener: Function): string | null;
    /**
     * Register a new listener.
     *
     * @param parameters
     * @param listener
     * @return {String}
     */
    addRegistration(registration: Registration): string;
    /**
     * Remove a registration, if it's not a `once` registration then instructs native
     * to also remove the underlying database query listener.
     *
     * @param registration
     * @return {boolean}
     */
    removeRegistration(registration: string): boolean;
    /**
     * Wraps a `once` listener with a new function that self de-registers.
     *
     * @param registration
     * @param listener
     * @return {function(...[*])}
     * @private
     */
    _onOnceRemoveRegistration(registration: any, listener: any): any;
}
declare const _default: SyncTree;
export default _default;
