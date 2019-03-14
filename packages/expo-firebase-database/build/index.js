import { NativeModulesProxy } from '@unimodules/core';
import firebase, { ModuleBase } from 'expo-firebase-app';
import Reference from './Reference';
import TransactionHandler from './transaction';
const NATIVE_EVENTS = {
    databaseTransactionEvent: 'Expo.Firebase.database_transaction_event',
};
export const MODULE_NAME = 'ExpoFirebaseDatabase';
export const NAMESPACE = 'database';
const { [MODULE_NAME]: NativeModule } = NativeModulesProxy;
export const statics = {
    ServerValue: NativeModule
        ? {
            TIMESTAMP: NativeModule.serverValueTimestamp || {
                '.sv': 'timestamp',
            },
        }
        : {},
    enableLogging(enabled) {
        if (NativeModule) {
            NativeModule.enableLogging(enabled);
        }
    },
};
/**
 * @class Database
 */
export default class Database extends ModuleBase {
    constructor(appOrCustomUrl, customUrl) {
        let app;
        let url;
        if (typeof appOrCustomUrl === 'string') {
            app = firebase.app();
            url = appOrCustomUrl;
        }
        else {
            app = appOrCustomUrl;
            url = customUrl || app.options.databaseURL;
        }
        // enforce trailing slash
        url = url.endsWith('/') ? url : `${url}/`;
        super(app, {
            events: Object.values(NATIVE_EVENTS),
            moduleName: MODULE_NAME,
            hasMultiAppSupport: true,
            hasCustomUrlSupport: true,
            namespace: NAMESPACE,
        }, url);
        this._serverTimeOffset = 0;
        this._databaseURL = url;
        this._transactionHandler = new TransactionHandler(this);
        if (app.options.persistence) {
            this.nativeModule.setPersistence(app.options.persistence);
        }
        // server time listener
        // setTimeout used to avoid setPersistence race conditions
        // todo move this and persistence to native side, create a db configure() method natively perhaps?
        // todo and then native can call setPersistence and then emit offset events
        setTimeout(() => {
            this._offsetRef = this.ref('.info/serverTimeOffset');
            this._offsetRef.on('value', snapshot => {
                this._serverTimeOffset = snapshot.val() || this._serverTimeOffset;
            });
        }, 1);
    }
    /**
     *
     * @return {number}
     */
    getServerTime() {
        return new Date(Date.now() + this._serverTimeOffset).getTime();
    }
    /**
     *
     */
    goOnline() {
        this.nativeModule.goOnline();
    }
    /**
     *
     */
    goOffline() {
        this.nativeModule.goOffline();
    }
    /**
     * Returns a new firebase reference instance
     * @param path
     * @returns {Reference}
     */
    ref(path) {
        return new Reference(this, path);
    }
    /**
     * Returns the database url
     * @returns {string}
     */
    get databaseUrl() {
        return this._databaseURL;
    }
}
Database.moduleName = MODULE_NAME;
Database.namespace = NAMESPACE;
Database.statics = statics;
//# sourceMappingURL=index.js.map