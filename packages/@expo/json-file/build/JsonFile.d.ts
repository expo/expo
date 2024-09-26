export type JSONValue = boolean | number | string | null | JSONArray | JSONObject;
export interface JSONArray extends Array<JSONValue> {
}
export interface JSONObject {
    [key: string]: JSONValue | undefined;
}
type Defined<T> = T extends undefined ? never : T;
type Options<TJSONObject extends JSONObject> = {
    badJsonDefault?: TJSONObject;
    jsonParseErrorDefault?: TJSONObject;
    cantReadFileDefault?: TJSONObject;
    ensureDir?: boolean;
    default?: TJSONObject;
    json5?: boolean;
    space?: number;
    addNewLineAtEOF?: boolean;
};
/**
 * The JsonFile class represents the contents of json file.
 *
 * It's polymorphic on "JSONObject", which is a simple type representing
 * and object with string keys and either objects or primitive types as values.
 * @type {[type]}
 */
export default class JsonFile<TJSONObject extends JSONObject> {
    file: string;
    options: Options<TJSONObject>;
    static read: typeof read;
    static readAsync: typeof readAsync;
    static parseJsonString: typeof parseJsonString;
    static write: typeof write;
    static writeAsync: typeof writeAsync;
    static get: typeof getSync;
    static getAsync: typeof getAsync;
    static set: typeof setSync;
    static setAsync: typeof setAsync;
    static merge: typeof merge;
    static mergeAsync: typeof mergeAsync;
    static deleteKey: typeof deleteKey;
    static deleteKeyAsync: typeof deleteKeyAsync;
    static deleteKeys: typeof deleteKeys;
    static deleteKeysAsync: typeof deleteKeysAsync;
    static rewrite: typeof rewrite;
    static rewriteAsync: typeof rewriteAsync;
    constructor(file: string, options?: Options<TJSONObject>);
    read(options?: Options<TJSONObject>): TJSONObject;
    readAsync(options?: Options<TJSONObject>): Promise<TJSONObject>;
    write(object: TJSONObject, options?: Options<TJSONObject>): TJSONObject;
    writeAsync(object: TJSONObject, options?: Options<TJSONObject>): Promise<TJSONObject>;
    parseJsonString(json: string, options?: Options<TJSONObject>): TJSONObject;
    get<K extends keyof TJSONObject, TDefault extends TJSONObject[K] | null>(key: K, defaultValue: TDefault, options?: Options<TJSONObject>): Defined<TJSONObject[K]> | TDefault;
    getAsync<K extends keyof TJSONObject, TDefault extends TJSONObject[K] | null>(key: K, defaultValue: TDefault, options?: Options<TJSONObject>): Promise<Defined<TJSONObject[K]> | TDefault>;
    set(key: string, value: unknown, options?: Options<TJSONObject>): TJSONObject;
    setAsync(key: string, value: unknown, options?: Options<TJSONObject>): Promise<TJSONObject>;
    merge(sources: Partial<TJSONObject> | Partial<TJSONObject>[], options?: Options<TJSONObject>): Promise<TJSONObject>;
    mergeAsync(sources: Partial<TJSONObject> | Partial<TJSONObject>[], options?: Options<TJSONObject>): Promise<TJSONObject>;
    deleteKey(key: string, options?: Options<TJSONObject>): TJSONObject;
    deleteKeyAsync(key: string, options?: Options<TJSONObject>): Promise<TJSONObject>;
    deleteKeys(keys: string[], options?: Options<TJSONObject>): TJSONObject;
    deleteKeysAsync(keys: string[], options?: Options<TJSONObject>): Promise<TJSONObject>;
    rewrite(options?: Options<TJSONObject>): TJSONObject;
    rewriteAsync(options?: Options<TJSONObject>): Promise<TJSONObject>;
    _getOptions(options?: Options<TJSONObject>): Options<TJSONObject>;
}
declare function read<TJSONObject extends JSONObject>(file: string, options?: Options<TJSONObject>): TJSONObject;
declare function readAsync<TJSONObject extends JSONObject>(file: string, options?: Options<TJSONObject>): Promise<TJSONObject>;
declare function parseJsonString<TJSONObject extends JSONObject>(json: string, options?: Options<TJSONObject>, fileName?: string): TJSONObject;
declare function getSync<TJSONObject extends JSONObject, K extends keyof TJSONObject, DefaultValue>(file: string, key: K, defaultValue: DefaultValue, options?: Options<TJSONObject>): any;
declare function getAsync<TJSONObject extends JSONObject, K extends keyof TJSONObject, DefaultValue>(file: string, key: K, defaultValue: DefaultValue, options?: Options<TJSONObject>): Promise<any>;
declare function write<TJSONObject extends JSONObject>(file: string, object: TJSONObject, options?: Options<TJSONObject>): TJSONObject;
declare function writeAsync<TJSONObject extends JSONObject>(file: string, object: TJSONObject, options?: Options<TJSONObject>): Promise<TJSONObject>;
declare function setSync<TJSONObject extends JSONObject>(file: string, key: string, value: unknown, options?: Options<TJSONObject>): TJSONObject;
declare function setAsync<TJSONObject extends JSONObject>(file: string, key: string, value: unknown, options?: Options<TJSONObject>): Promise<TJSONObject>;
declare function mergeAsync<TJSONObject extends JSONObject>(file: string, sources: Partial<TJSONObject> | Partial<TJSONObject>[], options?: Options<TJSONObject>): Promise<TJSONObject>;
declare function merge<TJSONObject extends JSONObject>(file: string, sources: Partial<TJSONObject> | Partial<TJSONObject>[], options?: Options<TJSONObject>): TJSONObject;
declare function deleteKeyAsync<TJSONObject extends JSONObject>(file: string, key: string, options?: Options<TJSONObject>): Promise<TJSONObject>;
declare function deleteKey<TJSONObject extends JSONObject>(file: string, key: string, options?: Options<TJSONObject>): TJSONObject;
declare function deleteKeysAsync<TJSONObject extends JSONObject>(file: string, keys: string[], options?: Options<TJSONObject>): Promise<TJSONObject>;
declare function deleteKeys<TJSONObject extends JSONObject>(file: string, keys: string[], options?: Options<TJSONObject>): TJSONObject;
declare function rewriteAsync<TJSONObject extends JSONObject>(file: string, options?: Options<TJSONObject>): Promise<TJSONObject>;
declare function rewrite<TJSONObject extends JSONObject>(file: string, options?: Options<TJSONObject>): TJSONObject;
export {};
