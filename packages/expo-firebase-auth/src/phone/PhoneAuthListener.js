// @flow
import { internals as INTERNALS } from 'expo-firebase-app';
import { events, getNativeModule, utils } from 'expo-firebase-app';
import type Auth from '../';

const { SharedEventEmitter } = events;
const { generatePushID, isFunction, isAndroid, isIOS, isString, nativeToJSError } = utils;

type PhoneAuthSnapshot = {
  state: 'sent' | 'timeout' | 'verified' | 'error',
  verificationId: string,
  code: string | null,
  error: Error | null,
};

type PhoneAuthError = {
  code: string | null,
  verificationId: string,
  message: string | null,
  stack: string | null,
};

export default class PhoneAuthListener {
  _auth: Auth;
  _timeout: number;
  _publicEvents: Object;
  _internalEvents: Object;
  _reject: Function | null;
  _resolve: Function | null;
  _credential: Object | null;
  _promise: Promise<*> | null;
  _phoneAuthRequestKey: string;

  /**
   *
   * @param auth
   * @param phoneNumber
   * @param timeout
   * @param forceResend
   */
  constructor(auth: Auth, phoneNumber: string, timeout?: number, forceResend?: boolean) {
    this._auth = auth;
    this._reject = null;
    this._resolve = null;
    this._promise = null;
    this._credential = null;

    this._timeout = timeout || 20; // 20 secs
    this._forceResending = forceResend || false;
    this._phoneAuthRequestKey = generatePushID();

    // internal events
    this._internalEvents = {
      codeSent: `phone:auth:${this._phoneAuthRequestKey}:onCodeSent`,
      verificationFailed: `phone:auth:${this._phoneAuthRequestKey}:onVerificationFailed`,
      verificationComplete: `phone:auth:${this._phoneAuthRequestKey}:onVerificationComplete`,
      codeAutoRetrievalTimeout: `phone:auth:${this
        ._phoneAuthRequestKey}:onCodeAutoRetrievalTimeout`,
    };

    // user observer events
    this._publicEvents = {
      // error cb
      error: `phone:auth:${this._phoneAuthRequestKey}:error`,
      // observer
      event: `phone:auth:${this._phoneAuthRequestKey}:event`,
      // success cb
      success: `phone:auth:${this._phoneAuthRequestKey}:success`,
    };

    // setup internal event listeners
    this._subscribeToEvents();

    // start verification flow natively
    if (isAndroid) {
      getNativeModule(this._auth).verifyPhoneNumber(
        phoneNumber,
        this._phoneAuthRequestKey,
        this._timeout,
        this._forceResending
      );
    }

    if (isIOS) {
      getNativeModule(this._auth).verifyPhoneNumber(phoneNumber, this._phoneAuthRequestKey);
    }
  }

  /**
   * Subscribes to all EE events on this._internalEvents
   * @private
   */
  _subscribeToEvents() {
    const events = Object.keys(this._internalEvents);

    for (let i = 0, len = events.length; i < len; i++) {
      const type = events[i];
      SharedEventEmitter.once(
        this._internalEvents[type],
        // $FlowExpectedError: Flow doesn't support indexable signatures on classes: https://github.com/facebook/flow/issues/1323
        this[`_${type}Handler`].bind(this)
      );
    }
  }

  /**
   * Subscribe a users listener cb to the snapshot events.
   * @param observer
   * @private
   */
  _addUserObserver(observer) {
    SharedEventEmitter.addListener(this._publicEvents.event, observer);
  }

  /**
   * Send a snapshot event to users event observer.
   * @param snapshot PhoneAuthSnapshot
   * @private
   */
  _emitToObservers(snapshot: PhoneAuthSnapshot) {
    SharedEventEmitter.emit(this._publicEvents.event, snapshot);
  }

  /**
   * Send a error snapshot event to any subscribed errorCb's
   * @param snapshot
   * @private
   */
  _emitToErrorCb(snapshot) {
    const { error } = snapshot;
    if (this._reject) this._reject(error);
    SharedEventEmitter.emit(this._publicEvents.error, error);
  }

  /**
   * Send a success snapshot event to any subscribed completeCb's
   * @param snapshot
   * @private
   */
  _emitToSuccessCb(snapshot) {
    if (this._resolve) this._resolve(snapshot);
    SharedEventEmitter.emit(this._publicEvents.success, snapshot);
  }

  /**
   * Removes all listeners for this phone auth instance
   * @private
   */
  _removeAllListeners() {
    setTimeout(() => {
      // move to next event loop - not sure if needed
      // internal listeners
      Object.values(this._internalEvents).forEach(event => {
        SharedEventEmitter.removeAllListeners(event);
      });

      // user observer listeners
      Object.values(this._publicEvents).forEach(publicEvent => {
        SharedEventEmitter.removeAllListeners(publicEvent);
      });
    }, 0);
  }

  /**
   * Create a new internal deferred promise, if not already created
   * @private
   */
  _promiseDeferred() {
    if (!this._promise) {
      this._promise = new Promise((resolve, reject) => {
        this._resolve = result => {
          this._resolve = null;
          return resolve(result);
        };

        this._reject = possibleError => {
          this._reject = null;
          return reject(possibleError);
        };
      });
    }
  }

  /* --------------------------
   --- INTERNAL EVENT HANDLERS
   ---------------------------- */

  /**
   * Internal code sent event handler
   * @private
   * @param credential
   */
  _codeSentHandler(credential) {
    const snapshot: PhoneAuthSnapshot = {
      verificationId: credential.verificationId,
      code: null,
      error: null,
      state: 'sent',
    };

    this._emitToObservers(snapshot);

    if (isIOS) {
      this._emitToSuccessCb(snapshot);
    }

    if (isAndroid) {
      // android can auto retrieve so we don't emit to successCb immediately,
      // if auto retrieve times out then that will emit to successCb
    }
  }

  /**
   * Internal code auto retrieve timeout event handler
   * @private
   * @param credential
   */
  _codeAutoRetrievalTimeoutHandler(credential) {
    const snapshot: PhoneAuthSnapshot = {
      verificationId: credential.verificationId,
      code: null,
      error: null,
      state: 'timeout',
    };

    this._emitToObservers(snapshot);
    this._emitToSuccessCb(snapshot);
  }

  /**
   * Internal verification complete event handler
   * @param credential
   * @private
   */
  _verificationCompleteHandler(credential) {
    const snapshot: PhoneAuthSnapshot = {
      verificationId: credential.verificationId,
      code: credential.code || null,
      error: null,
      state: 'verified',
    };

    this._emitToObservers(snapshot);
    this._emitToSuccessCb(snapshot);
    this._removeAllListeners();
  }

  /**
   * Internal verification failed event handler
   * @param state
   * @private
   */
  _verificationFailedHandler(state) {
    const snapshot: PhoneAuthSnapshot = {
      verificationId: state.verificationId,
      code: null,
      error: null,
      state: 'error',
    };

    const { code, message, nativeErrorMessage } = state.error;
    snapshot.error = nativeToJSError(code, message, { nativeErrorMessage });

    this._emitToObservers(snapshot);
    this._emitToErrorCb(snapshot);
    this._removeAllListeners();
  }

  /* -------------
   -- PUBLIC API
   --------------*/

  on(
    event: string,
    observer: PhoneAuthSnapshot => void,
    errorCb?: PhoneAuthError => void,
    successCb?: PhoneAuthSnapshot => void
  ): this {
    if (!isString(event)) {
      throw new Error(INTERNALS.STRINGS.ERROR_MISSING_ARG_NAMED('event', 'string', 'on'));
    }

    if (event !== 'state_changed') {
      throw new Error(INTERNALS.STRINGS.ERROR_ARG_INVALID_VALUE('event', 'state_changed', event));
    }

    if (!isFunction(observer)) {
      throw new Error(INTERNALS.STRINGS.ERROR_MISSING_ARG_NAMED('observer', 'function', 'on'));
    }

    this._addUserObserver(observer);

    if (isFunction(errorCb)) {
      SharedEventEmitter.once(this._publicEvents.error, errorCb);
    }

    if (isFunction(successCb)) {
      SharedEventEmitter.once(this._publicEvents.success, successCb);
    }

    return this;
  }

  /**
   * Promise .then proxy
   * @param fn
   */
  then(fn: PhoneAuthSnapshot => void) {
    this._promiseDeferred();
    // $FlowFixMe: Unsure how to annotate `bind` here
    if (this._promise) return this._promise.then.bind(this._promise)(fn);
    return undefined; // will never get here - just to keep flow happy
  }

  /**
   * Promise .catch proxy
   * @param fn
   */
  catch(fn: Error => void) {
    this._promiseDeferred();
    // $FlowFixMe: Unsure how to annotate `bind` here
    if (this._promise) return this._promise.catch.bind(this._promise)(fn);
    return undefined; // will never get here - just to keep flow happy
  }
}
