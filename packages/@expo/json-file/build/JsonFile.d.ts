export declare type JSONValue = boolean | number | string | null | JSONArray | JSONObject;
export interface JSONArray extends Array<JSONValue> {
}
export interface JSONObject {
    [key: string]: JSONValue | undefined;
}
declare type Defined<T> = T extends undefined ? never : T;
declare type Options<TJSONObject extends JSONObject> = {
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
    static writeAsync: typeof writeAsync;
    static getAsync: typeof getAsync;
    static setAsync: typeof setAsync;
    static mergeAsync: typeof mergeAsync;
    static deleteKeyAsync: typeof deleteKeyAsync;
    static deleteKeysAsync: typeof deleteKeysAsync;
    static rewriteAsync: typeof rewriteAsync;
    constructor(file: string, options?: Options<TJSONObject>);
    read(options?: Options<TJSONObject>): TJSONObject;
    readAsync(options?: Options<TJSONObject>): Promise<TJSONObject>;
    writeAsync(object: TJSONObject, options?: Options<TJSONObject>): Promise<TJSONObject>;
    parseJsonString(json: string, options?: Options<TJSONObject>): TJSONObject;
    getAsync<K extends keyof TJSONObject, TDefault extends TJSONObject[K] | null>(key: K, defaultValue: TDefault, options?: Options<TJSONObject>): Promise<Defined<TJSONObject[K]> | TDefault>;
    setAsync(key: string, value: unknown, options?: Options<TJSONObject>): Promise<TJSONObject>;
    mergeAsync(sources: Partial<TJSONObject> | Partial<TJSONObject>[], options?: Options<TJSONObject>): Promise<TJSONObject>;
    deleteKeyAsync(key: string, options?: Options<TJSONObject>): Promise<TJSONObject>;
    deleteKeysAsync(keys: string[], options?: Options<TJSONObject>): Promise<TJSONObject>;
    rewriteAsync(options?: Options<TJSONObject>): Promise<TJSONObject>;
    _getOptions(options?: Options<TJSONObject>): Options<TJSONObject>;
}
declare function read<TJSONObject extends JSONObject>(file: string, options?: Options<TJSONObject>): TJSONObject;
declare function readAsync<TJSONObject extends JSONObject>(file: string, options?: Options<TJSONObject>): Promise<TJSONObject>;
declare function parseJsonString<TJSONObject extends JSONObject>(json: string, options?: Options<TJSONObject>, fileName?: string): TJSONObject;
declare function getAsync<TJSONObject extends JSONObject, K extends keyof TJSONObject, DefaultValue>(file: string, key: K, defaultValue: DefaultValue, options?: Options<TJSONObject>): Promise<any>;
declare function writeAsync<TJSONObject extends JSONObject>(file: string, object: TJSONObject, options?: Options<TJSONObject>): Promise<TJSONObject>;
declare function setAsync<TJSONObject extends JSONObject>(file: string, key: string, value: unknown, options?: Options<TJSONObject>): Promise<TJSONObject>;
declare function mergeAsync<TJSONObject extends JSONObject>(file: string, sources: Partial<TJSONObject> | Partial<TJSONObject>[], options?: Options<TJSONObject>): Promise<TJSONObject>;
declare function deleteKeyAsync<TJSONObject extends JSONObject>(file: string, key: string, options?: Options<TJSONObject>): Promise<TJSONObject>;
declare function deleteKeysAsync<TJSONObject extends JSONObject>(file: string, keys: string[], options?: Options<TJSONObject>): Promise<TJSONObject>;
declare function rewriteAsync<TJSONObject extends JSONObject>(file: string, options?: Options<TJSONObject>): Promise<TJSONObject>;
export {};
