declare type Auth = any;
declare type PhoneAuthSnapshot = {
    state: 'sent' | 'timeout' | 'verified' | 'error';
    verificationId: string;
    code: string | null;
    error: Error | null;
};
declare type PhoneAuthError = {
    code: string | null;
    verificationId: string;
    message: string | null;
    stack: string | null;
};
export default class PhoneAuthListener {
    _auth: Auth;
    _timeout: number;
    _publicEvents: {
        [key: string]: any;
    };
    _internalEvents: {
        [key: string]: any;
    };
    _reject: Function | null;
    _resolve: Function | null;
    _credential: {
        [key: string]: any;
    } | null;
    _promise: Promise<any> | null;
    _phoneAuthRequestKey: string;
    _forceResending: any;
    /**
     *
     * @param auth
     * @param phoneNumber
     * @param timeout
     * @param forceResend
     */
    constructor(auth: Auth, phoneNumber: string, timeout?: number, forceResend?: boolean);
    /**
     * Subscribes to all EE events on this._internalEvents
     * @private
     */
    _subscribeToEvents(): void;
    /**
     * Subscribe a users listener cb to the snapshot events.
     * @param observer
     * @private
     */
    _addUserObserver(observer: any): void;
    /**
     * Send a snapshot event to users event observer.
     * @param snapshot PhoneAuthSnapshot
     * @private
     */
    _emitToObservers(snapshot: PhoneAuthSnapshot): void;
    /**
     * Send a error snapshot event to any subscribed errorCb's
     * @param snapshot
     * @private
     */
    _emitToErrorCb(snapshot: any): void;
    /**
     * Send a success snapshot event to any subscribed completeCb's
     * @param snapshot
     * @private
     */
    _emitToSuccessCb(snapshot: any): void;
    /**
     * Removes all listeners for this phone auth instance
     * @private
     */
    _removeAllListeners(): void;
    /**
     * Create a new internal deferred promise, if not already created
     * @private
     */
    _promiseDeferred(): void;
    /**
     * Internal code sent event handler
     * @private
     * @param credential
     */
    _codeSentHandler(credential: any): void;
    /**
     * Internal code auto retrieve timeout event handler
     * @private
     * @param credential
     */
    _codeAutoRetrievalTimeoutHandler(credential: any): void;
    /**
     * Internal verification complete event handler
     * @param credential
     * @private
     */
    _verificationCompleteHandler(credential: any): void;
    /**
     * Internal verification failed event handler
     * @param state
     * @private
     */
    _verificationFailedHandler(state: any): void;
    on(event: string, observer: (snapshot: PhoneAuthSnapshot) => void, errorCb?: (error: PhoneAuthError) => void, successCb?: (snapshot: PhoneAuthSnapshot) => void): this;
    /**
     * Promise .then proxy
     * @param fn
     */
    then(fn: (snapshot: PhoneAuthSnapshot) => void): any;
    /**
     * Promise .catch proxy
     * @param fn
     */
    catch(fn: (error: Error) => void): any;
}
export {};
