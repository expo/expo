import { SharedEventEmitter, utils } from 'expo-firebase-app';
import invariant from 'invariant';
import CollectionReference from './CollectionReference';
import DocumentSnapshot from './DocumentSnapshot';
import { parseUpdateArgs } from './utils';
import { buildNativeMap } from './utils/serialize';
const { firestoreAutoId, isFunction, isObject } = utils;
/**
 * @class DocumentReference
 */
export default class DocumentReference {
    constructor(firestore, documentPath) {
        this._documentPath = documentPath;
        this._firestore = firestore;
    }
    get firestore() {
        return this._firestore;
    }
    get id() {
        return this._documentPath.id;
    }
    get parent() {
        const parentPath = this._documentPath.parent();
        return new CollectionReference(this._firestore, parentPath);
    }
    get path() {
        return this._documentPath.relativeName;
    }
    collection(collectionPath) {
        const path = this._documentPath.child(collectionPath);
        invariant(path.isCollection, 'Argument "collectionPath" must point to a collection.');
        return new CollectionReference(this._firestore, path);
    }
    delete() {
        return this._firestore.nativeModule.documentDelete(this.path);
    }
    get(options) {
        if (options) {
            if (!isObject(options)) {
                return Promise.reject(new Error('DocumentReference.get failed: First argument must be an object.'));
            }
            else if (options.source &&
                (options.source !== 'default' && options.source !== 'server' && options.source !== 'cache')) {
                return Promise.reject(new Error('DocumentReference.get failed: GetOptions.source must be one of `default`, `server` or `cache`.'));
            }
        }
        return this._firestore.nativeModule
            .documentGet(this.path, options)
            .then(result => new DocumentSnapshot(this._firestore, result));
    }
    onSnapshot(optionsOrObserverOrOnNext, observerOrOnNextOrOnError, onError) {
        let observer;
        let docListenOptions = {};
        // Called with: onNext, ?onError
        if (optionsOrObserverOrOnNext && typeof optionsOrObserverOrOnNext === 'function') {
            if (observerOrOnNextOrOnError && typeof observerOrOnNextOrOnError !== 'function') {
                throw new Error('DocumentReference.onSnapshot failed: Second argument must be a valid function.');
            }
            observer = {
                next: optionsOrObserverOrOnNext,
                error: observerOrOnNextOrOnError,
            };
        }
        else if (optionsOrObserverOrOnNext && isObject(optionsOrObserverOrOnNext)) {
            // Called with: Observer
            optionsOrObserverOrOnNext = optionsOrObserverOrOnNext;
            if (optionsOrObserverOrOnNext.next) {
                if (typeof optionsOrObserverOrOnNext.next === 'function') {
                    if (optionsOrObserverOrOnNext.error && !isFunction(optionsOrObserverOrOnNext.error)) {
                        throw new Error('DocumentReference.onSnapshot failed: Observer.error must be a valid function.');
                    }
                    observer = {
                        next: optionsOrObserverOrOnNext.next,
                        error: optionsOrObserverOrOnNext.error,
                    };
                }
                else {
                    throw new Error('DocumentReference.onSnapshot failed: Observer.next must be a valid function.');
                }
            }
            else if (Object.prototype.hasOwnProperty.call(optionsOrObserverOrOnNext, 'includeMetadataChanges')) {
                docListenOptions = optionsOrObserverOrOnNext;
                // Called with: Options, onNext, ?onError
                if (isFunction(observerOrOnNextOrOnError)) {
                    if (onError && !isFunction(onError)) {
                        throw new Error('DocumentReference.onSnapshot failed: Third argument must be a valid function.');
                    }
                    observer = {
                        next: observerOrOnNextOrOnError,
                        error: onError,
                    };
                    // Called with Options, Observer
                }
                else if (observerOrOnNextOrOnError &&
                    isObject(observerOrOnNextOrOnError) &&
                    observerOrOnNextOrOnError['next']) {
                    if (typeof observerOrOnNextOrOnError['next'] === 'function') {
                        if (observerOrOnNextOrOnError['error'] &&
                            typeof observerOrOnNextOrOnError['error'] === 'function') {
                            throw new Error('DocumentReference.onSnapshot failed: Observer.error must be a valid function.');
                        }
                        observer = {
                            next: observerOrOnNextOrOnError['next'],
                            error: observerOrOnNextOrOnError['error'],
                        };
                    }
                    else {
                        throw new Error('DocumentReference.onSnapshot failed: Observer.next must be a valid function.');
                    }
                }
                else {
                    throw new Error('DocumentReference.onSnapshot failed: Second argument must be a function or observer.');
                }
            }
            else {
                throw new Error('DocumentReference.onSnapshot failed: First argument must be a function, observer or options.');
            }
        }
        else {
            throw new Error('DocumentReference.onSnapshot failed: Called with invalid arguments.');
        }
        const listenerId = firestoreAutoId();
        const listener = (nativeDocumentSnapshot) => {
            const documentSnapshot = new DocumentSnapshot(this.firestore, nativeDocumentSnapshot);
            observer.next(documentSnapshot);
        };
        // Listen to snapshot events
        SharedEventEmitter.addListener(this._firestore.getAppEventName(`onDocumentSnapshot:${listenerId}`), listener);
        // Listen for snapshot error events
        if (observer.error) {
            SharedEventEmitter.addListener(this._firestore.getAppEventName(`onDocumentSnapshotError:${listenerId}`), observer.error);
        }
        // Add the native listener
        this._firestore.nativeModule.documentOnSnapshot(this.path, listenerId, docListenOptions);
        // Return an unsubscribe method
        return this._offDocumentSnapshot.bind(this, listenerId, listener);
    }
    set(data, options) {
        const nativeData = buildNativeMap(data);
        return this._firestore.nativeModule.documentSet(this.path, nativeData, options);
    }
    update(...args) {
        const data = parseUpdateArgs(args, 'DocumentReference.update');
        const nativeData = buildNativeMap(data);
        return this._firestore.nativeModule.documentUpdate(this.path, nativeData);
    }
    /**
     * INTERNALS
     */
    /**
     * Remove document snapshot listener
     * @param listener
     */
    _offDocumentSnapshot(listenerId, listener) {
        this._firestore.logger.info('Removing onDocumentSnapshot listener');
        SharedEventEmitter.removeListener(this._firestore.getAppEventName(`onDocumentSnapshot:${listenerId}`), listener);
        SharedEventEmitter.removeListener(this._firestore.getAppEventName(`onDocumentSnapshotError:${listenerId}`), listener);
        this._firestore.nativeModule.documentOffSnapshot(this.path, listenerId);
    }
}
//# sourceMappingURL=DocumentReference.js.map