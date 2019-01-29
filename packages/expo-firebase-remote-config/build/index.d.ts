import { App, ModuleBase } from 'expo-firebase-app';
declare type NativeValue = {
    stringValue?: string;
    numberValue?: number;
    dataValue?: Object;
    boolValue?: boolean;
    source: 'remoteConfigSourceRemote' | 'remoteConfigSourceDefault' | ' remoteConfigSourceStatic';
};
export declare const MODULE_NAME = "ExpoFirebaseRemoteConfig";
export declare const NAMESPACE = "config";
export declare const statics: {};
declare type ConfigSnapshot = {
    source: string;
    val(): any;
};
/**
 * @class Config
 */
export default class RemoteConfig extends ModuleBase {
    static moduleName: string;
    static namespace: string;
    static statics: {};
    _developerModeEnabled: boolean;
    constructor(app: App);
    /**
     * Converts a native map to single JS value
     * @param nativeValue
     * @returns {*}
     * @private
     */
    _nativeValueToJS(nativeValue: NativeValue): ConfigSnapshot;
    /**
     * Enable Remote Config developer mode to allow for frequent refreshes of the cache
     */
    enableDeveloperMode(): void;
    /**
     * Fetches Remote Config data
     * Call activateFetched to make fetched data available in app
     * @returns {*|Promise.<String>}:
     */
    fetch(expiration?: number): Promise<string>;
    /**
     * Applies Fetched Config data to the Active Config
     * @returns {*|Promise.<Bool>}
     * resolves if there was a Fetched Config, and it was activated,
     * rejects if no Fetched Config was found, or the Fetched Config was already activated.
     */
    activateFetched(): Promise<boolean>;
    /**
     * Gets the config value of the default namespace.
     * @param key: Config key
     * @returns {*|Promise.<Object>}, will always resolve
     * Object looks like
     *  {
     *    "stringValue" : stringValue,
     *    "numberValue" : numberValue,
     *    "dataValue" : dataValue,
     *    "boolValue" : boolValue,
     *    "source" : OneOf<String>(remoteConfigSourceRemote|remoteConfigSourceDefault|remoteConfigSourceStatic)
     *  }
     */
    getValue(key: string): Promise<ConfigSnapshot>;
    /**
     * Gets the config value of the default namespace.
     * @param keys: Config key
     * @returns {*|Promise.<Object>}, will always resolve.
     * Result will be a dictionary of key and config objects
     * Object looks like
     *  {
     *    "stringValue" : stringValue,
     *    "numberValue" : numberValue,
     *    "dataValue" : dataValue,
     *    "boolValue" : boolValue,
     *    "source" : OneOf<String>(remoteConfigSourceRemote|remoteConfigSourceDefault|remoteConfigSourceStatic)
     *  }
     */
    getValues(keys: Array<string>): Promise<{
        [key: string]: ConfigSnapshot;
    }>;
    /**
     * Get the set of parameter keys that start with the given prefix, from the default namespace
     * @param prefix: The key prefix to look for. If prefix is nil or empty, returns all the keys.
     * @returns {*|Promise.<Array<String>>}
     */
    getKeysByPrefix(prefix?: string): Promise<string[]>;
    /**
     * Sets config defaults for parameter keys and values in the default namespace config.
     * @param defaults: A dictionary mapping a String key to a Object values.
     */
    setDefaults(defaults: Object): void;
    /**
     * Sets default configs from plist for default namespace;
     * @param resource: The plist file name or resource ID
     */
    setDefaultsFromResource(resource: string | number): void;
}
export { NativeValue, ConfigSnapshot };
