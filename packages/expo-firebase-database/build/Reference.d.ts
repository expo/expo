import { ReferenceBase, FirebaseError } from 'expo-firebase-app';
import DataSnapshot from './DataSnapshot';
import OnDisconnect from './OnDisconnect';
import Query from './Query';
import { DatabaseModifier } from './types';
declare type Database = {
    [key: string]: any;
};
declare type DatabaseListener = {
    listenerId: number;
    eventName: string;
    successCallback: Function;
    failureCallback?: Function;
};
/**
 * @typedef {String} ReferenceLocation - Path to location in the database, relative
 * to the root reference. Consists of a path where segments are separated by a
 * forward slash (/) and ends in a ReferenceKey - except the root location, which
 * has no ReferenceKey.
 *
 * @example
 * // root reference location: '/'
 * // non-root reference: '/path/to/referenceKey'
 */
/**
 * @typedef {String} ReferenceKey - Identifier for each location that is unique to that
 * location, within the scope of its parent. The last part of a ReferenceLocation.
 */
/**
 * Represents a specific location in your Database that can be used for
 * reading or writing data.
 *
 * You can reference the root using firebase.database().ref() or a child location
 * by calling firebase.database().ref("child/path").
 *
 * @link https://firebase.google.com/docs/reference/js/firebase.database.Reference
 * @class Reference
 * @extends ReferenceBase
 */
export default class Reference extends ReferenceBase {
    _database: Database;
    _promise: Promise<any> | null;
    _query: Query;
    _refListeners: {
        [listenerId: number]: DatabaseListener;
    };
    constructor(database: Database, path: string, existingModifiers?: DatabaseModifier[]);
    /**
     * By calling `keepSynced(true)` on a location, the data for that location will
     * automatically be downloaded and kept in sync, even when no listeners are
     * attached for that location. Additionally, while a location is kept synced,
     *  it will not be evicted from the persistent disk cache.
     *
     * @link https://firebase.google.com/docs/reference/android/com/google/firebase/database/Query.html#keepSynced(boolean)
     * @param bool
     * @returns {*}
     */
    keepSynced(bool: boolean): Promise<void>;
    /**
     * Writes data to this Database location.
     *
     * @link https://firebase.google.com/docs/reference/js/firebase.database.Reference#set
     * @param value
     * @param onComplete
     * @returns {Promise}
     */
    set(value: any, onComplete?: Function): Promise<void>;
    /**
     * Sets a priority for the data at this Database location.
     *
     * @link https://firebase.google.com/docs/reference/js/firebase.database.Reference#setPriority
     * @param priority
     * @param onComplete
     * @returns {Promise}
     */
    setPriority(priority: string | number | null, onComplete?: Function): Promise<void>;
    /**
     * Writes data the Database location. Like set() but also specifies the priority for that data.
     *
     * @link https://firebase.google.com/docs/reference/js/firebase.database.Reference#setWithPriority
     * @param value
     * @param priority
     * @param onComplete
     * @returns {Promise}
     */
    setWithPriority(value: any, priority: string | number | null, onComplete?: Function): Promise<void>;
    /**
     * Writes multiple values to the Database at once.
     *
     * @link https://firebase.google.com/docs/reference/js/firebase.database.Reference#update
     * @param val
     * @param onComplete
     * @returns {Promise}
     */
    update(val: Object, onComplete?: Function): Promise<void>;
    /**
     * Removes the data at this Database location.
     *
     * @link https://firebase.google.com/docs/reference/js/firebase.database.Reference#remove
     * @param onComplete
     * @return {Promise}
     */
    remove(onComplete?: Function): Promise<void>;
    /**
     * Atomically modifies the data at this location.
     *
     * @link https://firebase.google.com/docs/reference/js/firebase.database.Reference#transaction
     * @param transactionUpdate
     * @param onComplete
     * @param applyLocally
     */
    transaction(transactionUpdate: Function, onComplete: (error: Error | null, committed: boolean, snapshot?: DataSnapshot | null) => any, applyLocally?: boolean): Promise<{}>;
    /**
     *
     * @param eventName
     * @param successCallback
     * @param cancelOrContext
     * @param context
     * @returns {Promise.<any>}
     */
    once(eventName: string | undefined, successCallback: (snapshot: DataSnapshot) => void, cancelOrContext: (error: FirebaseError) => void, context?: Object): any;
    /**
     *
     * @param value
     * @param onComplete
     * @returns {*}
     */
    push(value: any, onComplete?: Function): ThenableReference<{}>;
    /**
     * MODIFIERS
     */
    /**
     *
     * @returns {Reference}
     */
    orderByKey(): Reference;
    /**
     *
     * @returns {Reference}
     */
    orderByPriority(): Reference;
    /**
     *
     * @returns {Reference}
     */
    orderByValue(): Reference;
    /**
     *
     * @param key
     * @returns {Reference}
     */
    orderByChild(key: string): Reference;
    /**
     *
     * @param name
     * @param key
     * @returns {Reference}
     */
    orderBy(name: string, key?: string): Reference;
    /**
     * LIMITS
     */
    /**
     *
     * @param limit
     * @returns {Reference}
     */
    limitToLast(limit: number): Reference;
    /**
     *
     * @param limit
     * @returns {Reference}
     */
    limitToFirst(limit: number): Reference;
    /**
     *
     * @param name
     * @param limit
     * @returns {Reference}
     */
    limit(name: string, limit: number): Reference;
    /**
     * FILTERS
     */
    /**
     *
     * @param value
     * @param key
     * @returns {Reference}
     */
    equalTo(value: any, key?: string): Reference;
    /**
     *
     * @param value
     * @param key
     * @returns {Reference}
     */
    endAt(value: any, key?: string): Reference;
    /**
     *
     * @param value
     * @param key
     * @returns {Reference}
     */
    startAt(value: any, key?: string): Reference;
    /**
     *
     * @param name
     * @param value
     * @param key
     * @returns {Reference}
     */
    filter(name: string, value: any, key?: string): Reference;
    /**
     *
     * @returns {OnDisconnect}
     */
    onDisconnect(): OnDisconnect;
    /**
     * Creates a Reference to a child of the current Reference, using a relative path.
     * No validation is performed on the path to ensure it has a valid format.
     * @param {String} path relative to current ref's location
     * @returns {!Reference} A new Reference to the path provided, relative to the current
     * Reference
     * {@link https://firebase.google.com/docs/reference/js/firebase.database.Reference#child}
     */
    child(path: string): Reference;
    /**
     * Return the ref as a path string
     * @returns {string}
     */
    toString(): string;
    /**
     * Returns whether another Reference represent the same location and are from the
     * same instance of firebase.app.App - multiple firebase apps not currently supported.
     * @param {Reference} otherRef - Other reference to compare to this one
     * @return {Boolean} Whether otherReference is equal to this one
     *
     * {@link https://firebase.google.com/docs/reference/js/firebase.database.Reference#isEqual}
     */
    isEqual(otherRef: Reference): boolean;
    /**
     * GETTERS
     */
    /**
     * The parent location of a Reference, or null for the root Reference.
     * @type {Reference}
     *
     * {@link https://firebase.google.com/docs/reference/js/firebase.database.Reference#parent}
     */
    readonly parent: Reference | null;
    /**
     * A reference to itself
     * @type {!Reference}
     *
     * {@link https://firebase.google.com/docs/reference/js/firebase.database.Reference#ref}
     */
    readonly ref: Reference;
    /**
     * Reference to the root of the database: '/'
     * @type {!Reference}
     *
     * {@link https://firebase.google.com/docs/reference/js/firebase.database.Reference#root}
     */
    readonly root: Reference;
    /**
     * Access then method of promise if set
     * @return {*}
     */
    then(fnResolve: (value: any) => any, fnReject: (value: any) => any): any;
    /**
     * Access catch method of promise if set
     * @return {*}
     */
    catch(fnReject: (value: any) => any): any;
    /**
     * INTERNALS
     */
    /**
     * Generate a unique registration key.
     *
     * @return {string}
     */
    _getRegistrationKey(eventType: string): string;
    /**
     * Generate a string that uniquely identifies this
     * combination of path and query modifiers
     *
     * @return {string}
     * @private
     */
    _getRefKey(): string;
    /**
     * Set the promise this 'thenable' reference relates to
     * @param promise
     * @private
     */
    _setThenable(promise: Promise<any>): void;
    /**
     *
     * @param obj
     * @returns {Object}
     * @private
     */
    _serializeObject(obj: Object): any;
    /**
     *
     * @param value
     * @returns {*}
     * @private
     */
    _serializeAnyType(value: any): {
        type: string;
        value: any;
    };
    /**
     * Register a listener for data changes at the current ref's location.
     * The primary method of reading data from a Database.
     *
     * Listeners can be unbound using {@link off}.
     *
     * Event Types:
     *
     * - value: {@link callback}.
     * - child_added: {@link callback}
     * - child_removed: {@link callback}
     * - child_changed: {@link callback}
     * - child_moved: {@link callback}
     *
     * @param {ReferenceEventType} eventType - Type of event to attach a callback for.
     * @param {ReferenceEventCallback} callback - Function that will be called
     * when the event occurs with the new data.
     * @param {cancelCallbackOrContext=} cancelCallbackOrContext - Optional callback that is called
     * if the event subscription fails. {@link cancelCallbackOrContext}
     * @param {*=} context - Optional object to bind the callbacks to when calling them.
     * @returns {ReferenceEventCallback} callback function, unmodified (unbound), for
     * convenience if you want to pass an inline function to on() and store it later for
     * removing using off().
     *
     * {@link https://firebase.google.com/docs/reference/js/firebase.database.Reference#on}
     */
    on(eventType: string, callback: (snapshot: DataSnapshot) => any, cancelCallbackOrContext?: (value: any) => any | any, context?: any): Function;
    /**
     * Detaches a callback previously attached with on().
     *
     * Detach a callback previously attached with on(). Note that if on() was called
     * multiple times with the same eventType and callback, the callback will be called
     * multiple times for each event, and off() must be called multiple times to
     * remove the callback. Calling off() on a parent listener will not automatically
     * remove listeners registered on child nodes, off() must also be called on any
     * child listeners to remove the callback.
     *
     *  If a callback is not specified, all callbacks for the specified eventType will be removed.
     * Similarly, if no eventType or callback is specified, all callbacks for the Reference will be removed.
     * @param eventType
     * @param originalCallback
     */
    off(eventType?: string, originalCallback?: () => any): number | any[];
}
declare class ThenableReference<R> extends Reference {
    then<U>(onFulfill?: (value: R) => Promise<U> | U, onReject?: (error: any) => Promise<U> | U): Promise<U>;
    catch<U>(onReject?: (error: any) => Promise<U> | U): Promise<R | U>;
}
export {};
