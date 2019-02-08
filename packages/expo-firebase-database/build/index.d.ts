import { App, ModuleBase } from 'expo-firebase-app';
import Reference from './Reference';
import TransactionHandler from './transaction';
export declare const MODULE_NAME = "ExpoFirebaseDatabase";
export declare const NAMESPACE = "database";
export declare const statics: {
    ServerValue: {
        TIMESTAMP: any;
    } | {
        TIMESTAMP?: undefined;
    };
    enableLogging(enabled: boolean): void;
};
/**
 * @class Database
 */
export default class Database extends ModuleBase {
    static moduleName: string;
    static namespace: string;
    static statics: {
        ServerValue: {
            TIMESTAMP: any;
        } | {
            TIMESTAMP?: undefined;
        };
        enableLogging(enabled: boolean): void;
    };
    _databaseURL: string;
    _offsetRef?: Reference;
    _serverTimeOffset: number;
    _transactionHandler: TransactionHandler;
    constructor(appOrCustomUrl: App | string, customUrl?: string);
    /**
     *
     * @return {number}
     */
    getServerTime(): number;
    /**
     *
     */
    goOnline(): void;
    /**
     *
     */
    goOffline(): void;
    /**
     * Returns a new firebase reference instance
     * @param path
     * @returns {Reference}
     */
    ref(path: string): Reference;
    /**
     * Returns the database url
     * @returns {string}
     */
    readonly databaseUrl: string;
}
