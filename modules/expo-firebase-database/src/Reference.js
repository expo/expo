/**
 * @flow
 * Database Reference representation wrapper
 */
import { getLogger, utils, getNativeModule, ReferenceBase } from 'expo-firebase-app';
import SyncTree from './SyncTree';
import Query from './Query';
import DataSnapshot from './DataSnapshot';
import OnDisconnect from './OnDisconnect';
import type Database from './index';
import type { DatabaseModifier, FirebaseError } from './types';

const {
  promiseOrCallback,
  isFunction,
  isObject,
  isString,
  tryJSONParse,
  tryJSONStringify,
  generatePushID,
} = utils;

// track all event registrations by path
let listeners = 0;

/**
 * Enum for event types
 * @readonly
 * @enum {String}
 */
const ReferenceEventTypes = {
  value: 'value',
  child_added: 'child_added',
  child_removed: 'child_removed',
  child_changed: 'child_changed',
  child_moved: 'child_moved',
};

type DatabaseListener = {
  listenerId: number,
  eventName: string,
  successCallback: Function,
  failureCallback?: Function,
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
  _promise: ?Promise<*>;
  _query: Query;
  _refListeners: { [listenerId: number]: DatabaseListener };

  constructor(database: Database, path: string, existingModifiers?: Array<DatabaseModifier>) {
    super(path);
    this._promise = null;
    this._refListeners = {};
    this._database = database;
    this._query = new Query(this, existingModifiers);
    getLogger(database).debug('Created new Reference', this._getRefKey());
  }

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
  keepSynced(bool: boolean): Promise<void> {
    return getNativeModule(this._database).keepSynced(
      this._getRefKey(),
      this.path,
      this._query.getModifiers(),
      bool
    );
  }

  /**
   * Writes data to this Database location.
   *
   * @link https://firebase.google.com/docs/reference/js/firebase.database.Reference#set
   * @param value
   * @param onComplete
   * @returns {Promise}
   */
  set(value: any, onComplete?: Function): Promise<void> {
    return promiseOrCallback(
      getNativeModule(this._database).set(this.path, this._serializeAnyType(value)),
      onComplete
    );
  }

  /**
   * Sets a priority for the data at this Database location.
   *
   * @link https://firebase.google.com/docs/reference/js/firebase.database.Reference#setPriority
   * @param priority
   * @param onComplete
   * @returns {Promise}
   */
  setPriority(priority: string | number | null, onComplete?: Function): Promise<void> {
    const _priority = this._serializeAnyType(priority);

    return promiseOrCallback(
      getNativeModule(this._database).setPriority(this.path, _priority),
      onComplete
    );
  }

  /**
   * Writes data the Database location. Like set() but also specifies the priority for that data.
   *
   * @link https://firebase.google.com/docs/reference/js/firebase.database.Reference#setWithPriority
   * @param value
   * @param priority
   * @param onComplete
   * @returns {Promise}
   */
  setWithPriority(
    value: any,
    priority: string | number | null,
    onComplete?: Function
  ): Promise<void> {
    const _value = this._serializeAnyType(value);
    const _priority = this._serializeAnyType(priority);

    return promiseOrCallback(
      getNativeModule(this._database).setWithPriority(this.path, _value, _priority),
      onComplete
    );
  }

  /**
   * Writes multiple values to the Database at once.
   *
   * @link https://firebase.google.com/docs/reference/js/firebase.database.Reference#update
   * @param val
   * @param onComplete
   * @returns {Promise}
   */
  update(val: Object, onComplete?: Function): Promise<void> {
    const value = this._serializeObject(val);

    return promiseOrCallback(getNativeModule(this._database).update(this.path, value), onComplete);
  }

  /**
   * Removes the data at this Database location.
   *
   * @link https://firebase.google.com/docs/reference/js/firebase.database.Reference#remove
   * @param onComplete
   * @return {Promise}
   */
  remove(onComplete?: Function): Promise<void> {
    return promiseOrCallback(getNativeModule(this._database).remove(this.path), onComplete);
  }

  /**
   * Atomically modifies the data at this location.
   *
   * @link https://firebase.google.com/docs/reference/js/firebase.database.Reference#transaction
   * @param transactionUpdate
   * @param onComplete
   * @param applyLocally
   */
  transaction(
    transactionUpdate: Function,
    onComplete: (error: ?Error, committed: boolean, snapshot: ?DataSnapshot) => *,
    applyLocally: boolean = false
  ) {
    if (!isFunction(transactionUpdate)) {
      return Promise.reject(new Error('Missing transactionUpdate function argument.'));
    }

    return new Promise((resolve, reject) => {
      const onCompleteWrapper = (error, committed, snapshotData) => {
        if (isFunction(onComplete)) {
          if (error) {
            onComplete(error, committed, null);
          } else {
            onComplete(null, committed, new DataSnapshot(this, snapshotData));
          }
        }

        if (error) return reject(error);
        return resolve({
          committed,
          snapshot: new DataSnapshot(this, snapshotData),
        });
      };

      // start the transaction natively
      this._database._transactionHandler.add(
        this,
        transactionUpdate,
        onCompleteWrapper,
        applyLocally
      );
    });
  }

  /**
   *
   * @param eventName
   * @param successCallback
   * @param cancelOrContext
   * @param context
   * @returns {Promise.<any>}
   */
  once(
    eventName: string = 'value',
    successCallback: (snapshot: DataSnapshot) => void,
    cancelOrContext: (error: FirebaseError) => void,
    context?: Object
  ) {
    return getNativeModule(this._database)
      .once(this._getRefKey(), this.path, this._query.getModifiers(), eventName)
      .then(({ snapshot }) => {
        const _snapshot = new DataSnapshot(this, snapshot);

        if (isFunction(successCallback)) {
          if (isObject(cancelOrContext)) successCallback.bind(cancelOrContext)(_snapshot);
          if (context && isObject(context)) successCallback.bind(context)(_snapshot);
          successCallback(_snapshot);
        }

        return _snapshot;
      })
      .catch(error => {
        if (isFunction(cancelOrContext)) return cancelOrContext(error);
        throw error;
      });
  }

  /**
   *
   * @param value
   * @param onComplete
   * @returns {*}
   */
  push(value: any, onComplete?: Function): ThenableReference<void> {
    if (value === null || value === undefined) {
      return new ThenableReference(
        this._database,
        `${this.path}/${generatePushID(this._database._serverTimeOffset)}`
      );
    }

    const newRef = new ThenableReference(
      this._database,
      `${this.path}/${generatePushID(this._database._serverTimeOffset)}`
    );
    const promise = newRef.set(value);

    // if callback provided then internally call the set promise with value
    if (isFunction(onComplete)) {
      return (
        promise
          // $FlowExpectedError: Reports that onComplete can change to null despite the null check: https://github.com/facebook/flow/issues/1655
          .then(() => onComplete(null, newRef))
          // $FlowExpectedError: Reports that onComplete can change to null despite the null check: https://github.com/facebook/flow/issues/1655
          .catch(error => onComplete(error, null))
      );
    }

    // otherwise attach promise to 'thenable' reference and return the
    // new reference
    newRef._setThenable(promise);
    return newRef;
  }

  /**
   * MODIFIERS
   */

  /**
   *
   * @returns {Reference}
   */
  orderByKey(): Reference {
    return this.orderBy('orderByKey');
  }

  /**
   *
   * @returns {Reference}
   */
  orderByPriority(): Reference {
    return this.orderBy('orderByPriority');
  }

  /**
   *
   * @returns {Reference}
   */
  orderByValue(): Reference {
    return this.orderBy('orderByValue');
  }

  /**
   *
   * @param key
   * @returns {Reference}
   */
  orderByChild(key: string): Reference {
    return this.orderBy('orderByChild', key);
  }

  /**
   *
   * @param name
   * @param key
   * @returns {Reference}
   */
  orderBy(name: string, key?: string): Reference {
    const newRef = new Reference(this._database, this.path, this._query.getModifiers());
    newRef._query.orderBy(name, key);
    return newRef;
  }

  /**
   * LIMITS
   */

  /**
   *
   * @param limit
   * @returns {Reference}
   */
  limitToLast(limit: number): Reference {
    return this.limit('limitToLast', limit);
  }

  /**
   *
   * @param limit
   * @returns {Reference}
   */
  limitToFirst(limit: number): Reference {
    return this.limit('limitToFirst', limit);
  }

  /**
   *
   * @param name
   * @param limit
   * @returns {Reference}
   */
  limit(name: string, limit: number): Reference {
    const newRef = new Reference(this._database, this.path, this._query.getModifiers());
    newRef._query.limit(name, limit);
    return newRef;
  }

  /**
   * FILTERS
   */

  /**
   *
   * @param value
   * @param key
   * @returns {Reference}
   */
  equalTo(value: any, key?: string): Reference {
    return this.filter('equalTo', value, key);
  }

  /**
   *
   * @param value
   * @param key
   * @returns {Reference}
   */
  endAt(value: any, key?: string): Reference {
    return this.filter('endAt', value, key);
  }

  /**
   *
   * @param value
   * @param key
   * @returns {Reference}
   */
  startAt(value: any, key?: string): Reference {
    return this.filter('startAt', value, key);
  }

  /**
   *
   * @param name
   * @param value
   * @param key
   * @returns {Reference}
   */
  filter(name: string, value: any, key?: string): Reference {
    const newRef = new Reference(this._database, this.path, this._query.getModifiers());
    newRef._query.filter(name, value, key);
    return newRef;
  }

  /**
   *
   * @returns {OnDisconnect}
   */
  onDisconnect(): OnDisconnect {
    return new OnDisconnect(this);
  }

  /**
   * Creates a Reference to a child of the current Reference, using a relative path.
   * No validation is performed on the path to ensure it has a valid format.
   * @param {String} path relative to current ref's location
   * @returns {!Reference} A new Reference to the path provided, relative to the current
   * Reference
   * {@link https://firebase.google.com/docs/reference/js/firebase.database.Reference#child}
   */
  child(path: string): Reference {
    return new Reference(this._database, `${this.path}/${path}`);
  }

  /**
   * Return the ref as a path string
   * @returns {string}
   */
  toString(): string {
    return `${this._database.databaseUrl}/${this.path}`;
  }

  /**
   * Returns whether another Reference represent the same location and are from the
   * same instance of firebase.app.App - multiple firebase apps not currently supported.
   * @param {Reference} otherRef - Other reference to compare to this one
   * @return {Boolean} Whether otherReference is equal to this one
   *
   * {@link https://firebase.google.com/docs/reference/js/firebase.database.Reference#isEqual}
   */
  isEqual(otherRef: Reference): boolean {
    return (
      !!otherRef &&
      otherRef.constructor === Reference &&
      otherRef.key === this.key &&
      this._query.queryIdentifier() === otherRef._query.queryIdentifier()
    );
  }

  /**
   * GETTERS
   */

  /**
   * The parent location of a Reference, or null for the root Reference.
   * @type {Reference}
   *
   * {@link https://firebase.google.com/docs/reference/js/firebase.database.Reference#parent}
   */
  get parent(): Reference | null {
    if (this.path === '/') return null;
    return new Reference(this._database, this.path.substring(0, this.path.lastIndexOf('/')));
  }

  /**
   * A reference to itself
   * @type {!Reference}
   *
   * {@link https://firebase.google.com/docs/reference/js/firebase.database.Reference#ref}
   */
  get ref(): Reference {
    return this;
  }

  /**
   * Reference to the root of the database: '/'
   * @type {!Reference}
   *
   * {@link https://firebase.google.com/docs/reference/js/firebase.database.Reference#root}
   */
  get root(): Reference {
    return new Reference(this._database, '/');
  }

  /**
   * Access then method of promise if set
   * @return {*}
   */
  then(fnResolve: any => any, fnReject: any => any) {
    if (isFunction(fnResolve) && this._promise && this._promise.then) {
      return this._promise.then.bind(this._promise)(
        result => {
          this._promise = null;
          return fnResolve(result);
        },
        possibleErr => {
          this._promise = null;

          if (isFunction(fnReject)) {
            return fnReject(possibleErr);
          }

          throw possibleErr;
        }
      );
    }

    throw new Error("Cannot read property 'then' of undefined.");
  }

  /**
   * Access catch method of promise if set
   * @return {*}
   */
  catch(fnReject: any => any) {
    if (isFunction(fnReject) && this._promise && this._promise.catch) {
      return this._promise.catch.bind(this._promise)(possibleErr => {
        this._promise = null;
        return fnReject(possibleErr);
      });
    }

    throw new Error("Cannot read property 'catch' of undefined.");
  }

  /**
   * INTERNALS
   */

  /**
   * Generate a unique registration key.
   *
   * @return {string}
   */
  _getRegistrationKey(eventType: string): string {
    return `$${this._database.databaseUrl}$/${this
      .path}$${this._query.queryIdentifier()}$${listeners}$${eventType}`;
  }

  /**
   * Generate a string that uniquely identifies this
   * combination of path and query modifiers
   *
   * @return {string}
   * @private
   */
  _getRefKey() {
    return `$${this._database.databaseUrl}$/${this.path}$${this._query.queryIdentifier()}`;
  }

  /**
   * Set the promise this 'thenable' reference relates to
   * @param promise
   * @private
   */
  _setThenable(promise: Promise<*>) {
    this._promise = promise;
  }

  /**
   *
   * @param obj
   * @returns {Object}
   * @private
   */
  _serializeObject(obj: Object) {
    if (!isObject(obj)) return obj;

    // json stringify then parse it calls toString on Objects / Classes
    // that support it i.e new Date() becomes a ISO string.
    return tryJSONParse(tryJSONStringify(obj));
  }

  /**
   *
   * @param value
   * @returns {*}
   * @private
   */
  _serializeAnyType(value: any) {
    if (isObject(value)) {
      return {
        type: 'object',
        value: this._serializeObject(value),
      };
    }

    return {
      type: typeof value,
      value,
    };
  }

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
  on(
    eventType: string,
    callback: DataSnapshot => any,
    cancelCallbackOrContext?: Object => any | Object,
    context?: Object
  ): Function {
    if (!eventType) {
      throw new Error('Query.on failed: Function called with 0 arguments. Expects at least 2.');
    }

    if (!isString(eventType) || !ReferenceEventTypes[eventType]) {
      throw new Error(
        `Query.on failed: First argument must be a valid string event type: "${Object.keys(
          ReferenceEventTypes
        ).join(', ')}"`
      );
    }

    if (!callback) {
      throw new Error('Query.on failed: Function called with 1 argument. Expects at least 2.');
    }

    if (!isFunction(callback)) {
      throw new Error('Query.on failed: Second argument must be a valid function.');
    }

    if (
      cancelCallbackOrContext &&
      !isFunction(cancelCallbackOrContext) &&
      !isObject(context) &&
      !isObject(cancelCallbackOrContext)
    ) {
      throw new Error(
        'Query.on failed: Function called with 3 arguments, but third optional argument `cancelCallbackOrContext` was not a function.'
      );
    }

    if (cancelCallbackOrContext && !isFunction(cancelCallbackOrContext) && context) {
      throw new Error(
        'Query.on failed: Function called with 4 arguments, but third optional argument `cancelCallbackOrContext` was not a function.'
      );
    }

    const eventRegistrationKey = this._getRegistrationKey(eventType);
    const registrationCancellationKey = `${eventRegistrationKey}$cancelled`;
    const _context =
      cancelCallbackOrContext && !isFunction(cancelCallbackOrContext)
        ? cancelCallbackOrContext
        : context;
    const registrationObj = {
      eventType,
      ref: this,
      path: this.path,
      key: this._getRefKey(),
      appName: this._database.app.name,
      dbURL: this._database.databaseUrl,
      eventRegistrationKey,
    };

    SyncTree.addRegistration({
      ...registrationObj,
      listener: _context ? callback.bind(_context) : callback,
    });

    if (cancelCallbackOrContext && isFunction(cancelCallbackOrContext)) {
      // cancellations have their own separate registration
      // as these are one off events, and they're not guaranteed
      // to occur either, only happens on failure to register on native
      SyncTree.addRegistration({
        ref: this,
        once: true,
        path: this.path,
        key: this._getRefKey(),
        appName: this._database.app.name,
        dbURL: this._database.databaseUrl,
        eventType: `${eventType}$cancelled`,
        eventRegistrationKey: registrationCancellationKey,
        listener: _context ? cancelCallbackOrContext.bind(_context) : cancelCallbackOrContext,
      });
    }

    // initialise the native listener if not already listening
    getNativeModule(this._database).on({
      eventType,
      path: this.path,
      key: this._getRefKey(),
      appName: this._database.app.name,
      modifiers: this._query.getModifiers(),
      hasCancellationCallback: isFunction(cancelCallbackOrContext),
      registration: {
        eventRegistrationKey,
        key: registrationObj.key,
        registrationCancellationKey,
      },
    });

    // increment number of listeners - just s short way of making
    // every registration unique per .on() call
    listeners += 1;

    // return original unbound successCallback for
    // the purposes of calling .off(eventType, callback) at a later date
    return callback;
  }

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
  off(eventType?: string = '', originalCallback?: () => any) {
    if (!arguments.length) {
      // Firebase Docs:
      //     if no eventType or callback is specified, all callbacks for the Reference will be removed.
      return SyncTree.removeListenersForRegistrations(SyncTree.getRegistrationsByPath(this.path));
    }

    /*
     * VALIDATE ARGS
     */
    if (eventType && (!isString(eventType) || !ReferenceEventTypes[eventType])) {
      throw new Error(
        `Query.off failed: First argument must be a valid string event type: "${Object.keys(
          ReferenceEventTypes
        ).join(', ')}"`
      );
    }

    if (originalCallback && !isFunction(originalCallback)) {
      throw new Error(
        'Query.off failed: Function called with 2 arguments, but second optional argument was not a function.'
      );
    }

    // Firebase Docs:
    //     Note that if on() was called
    //     multiple times with the same eventType and callback, the callback will be called
    //     multiple times for each event, and off() must be called multiple times to
    //     remove the callback.
    // Remove only a single registration
    if (eventType && originalCallback) {
      const registration = SyncTree.getOneByPathEventListener(
        this.path,
        eventType,
        originalCallback
      );
      if (!registration) return [];

      // remove the paired cancellation registration if any exist
      SyncTree.removeListenersForRegistrations([`${registration}$cancelled`]);

      // remove only the first registration to match firebase web sdk
      // call multiple times to remove multiple registrations
      return SyncTree.removeListenerRegistrations(originalCallback, [registration]);
    }

    // Firebase Docs:
    //     If a callback is not specified, all callbacks for the specified eventType will be removed.
    const registrations = SyncTree.getRegistrationsByPathEvent(this.path, eventType);

    SyncTree.removeListenersForRegistrations(
      SyncTree.getRegistrationsByPathEvent(this.path, `${eventType}$cancelled`)
    );

    return SyncTree.removeListenersForRegistrations(registrations);
  }
}

// eslint-disable-next-line no-unused-vars
declare class ThenableReference<+R> extends Reference {
  then<U>(
    onFulfill?: (value: R) => Promise<U> | U,
    onReject?: (error: any) => Promise<U> | U
  ): Promise<U>;
  catch<U>(onReject?: (error: any) => Promise<U> | U): Promise<R | U>;
}
