import { NativeModulesProxy } from '@unimodules/core';
import SharedEventEmitter from './utils/SharedEventEmitter';
import INTERNALS from './utils/internals';
import { isObject } from './utils';
import { createAppModule } from './utils/createAppModule';
import { FirebaseNamespaces, DEFAULT_APP_NAME } from './constants';
const { ExpoFirebaseApp: FirebaseCoreModule } = NativeModulesProxy;
export default class App {
    constructor(name, options, fromNative = false) {
        this._initialized = false;
        this._nativeInitialized = false;
        this._name = name;
        this._options = Object.assign({}, options);
        if (fromNative) {
            this._initialized = true;
            this._nativeInitialized = true;
        }
        else if (options.databaseURL && options.apiKey) {
            FirebaseCoreModule.initializeApp(this._name, this._options).then(result => {
                this._initialized = true;
                SharedEventEmitter.emit(`AppReady:${this._name}`, { error: null, result });
            });
        }
        Object.keys(FirebaseNamespaces).map(namespace => {
            this[namespace] = createAppModule(this, namespace);
        });
        this._extendedProps = {};
    }
    /**
     *
     * @return {*}
     */
    get name() {
        return this._name;
    }
    /**
     *
     * @return {*}
     */
    get options() {
        return Object.assign({}, this._options);
    }
    /**
     * Undocumented firebase web sdk method that allows adding additional properties onto
     * a firebase app instance.
     *
     * See: https://github.com/firebase/firebase-js-sdk/blob/master/tests/app/firebase_app.test.ts#L328
     *
     * @param props
     */
    extendApp(props) {
        if (!isObject(props)) {
            throw new Error(INTERNALS.STRINGS.ERROR_MISSING_ARG('Object', 'extendApp'));
        }
        const keys = Object.keys(props);
        for (let i = 0, len = keys.length; i < len; i++) {
            const key = keys[i];
            if (!this._extendedProps[key] && Object.hasOwnProperty.call(this, key)) {
                throw new Error(INTERNALS.STRINGS.ERROR_PROTECTED_PROP(key));
            }
            // $FlowExpectedError: Flow doesn't support indexable signatures on classes: https://github.com/facebook/flow/issues/1323
            this[key] = props[key];
            this._extendedProps[key] = true;
        }
    }
    async delete() {
        if (this._name === DEFAULT_APP_NAME && this._nativeInitialized) {
            throw new Error('Unable to delete the default native firebase app instance.');
        }
        return await FirebaseCoreModule.deleteApp(this._name);
    }
    async onReady() {
        if (this._initialized) {
            return this;
        }
        return new Promise((resolve, reject) => {
            SharedEventEmitter.once(`AppReady:${this._name}`, ({ error }) => {
                if (error)
                    return reject(new Error(error)); // error is a string as it's from native
                return resolve(this); // return app
            });
        });
    }
    /**
     * toString returns the name of the app.
     *
     * @return {string}
     */
    toString() {
        return this._name;
    }
}
//# sourceMappingURL=app.js.map