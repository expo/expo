/**
 * Checks for property existence by name on the specified object
 * @param object
 * @param property
 * @returns {*}
 */
export declare function hop(object: any, property: string): boolean;
/**
 * Deep get a value from an object.
 * @website https://github.com/Salakar/deeps
 * @param object
 * @param path
 * @param joiner
 * @returns {*}
 */
export declare function deepGet(object: any, path: string, joiner?: string): any;
/**
 * Deep check if a key exists.
 * @website https://github.com/Salakar/deeps
 * @param object
 * @param path
 * @param joiner
 * @returns {*}
 */
export declare function deepExists(object: any, path: string, joiner?: string): boolean;
/**
 * Deep Check if obj1 keys are contained in obj2
 * @param obj1
 * @param obj2
 * @returns {boolean}
 */
export declare function areObjectKeysContainedInOther(obj1: any, obj2: any): boolean;
/**
 * Check if arr1 is contained in arr2
 * @param arr1
 * @param arr2
 * @returns {boolean}
 */
export declare function isArrayContainedInOther(arr1: any[], arr2: any[]): boolean;
/**
 * Simple is object check.
 * @param item
 * @returns {boolean}
 */
export declare function isObject(item: any): boolean;
/**
 * Simple is function check
 * @param item
 * @returns {*|boolean}
 */
export declare function isFunction(item?: any): boolean;
/**
 * Simple is string check
 * @param value
 * @return {boolean}
 */
export declare function isString(value: any): boolean;
/**
 * Simple is boolean check
 * @param value
 * @return {boolean}
 */
export declare function isBoolean(value: any): boolean;
/**
 *
 * @param string
 * @returns {*}
 */
export declare function tryJSONParse(string: string | null): any;
/**
 *
 * @param data
 * @returns {*}
 */
export declare function tryJSONStringify(data: any): string | null;
/**
 * No operation func
 */
export declare function noop(): void;
/**
 * Remove a trailing forward slash from a string
 * @param str
 * @returns {*}
 */
export declare function stripTrailingSlash(str: string): string;
/**
 * Returns a string typeof that's valid for Firebase usage
 * @param value
 * @return {*}
 */
export declare function typeOf(value: any): string;
/**
 * Generate a firebase id - for use with ref().push(val, cb) - e.g. -KXMr7k2tXUFQqiaZRY4'
 * @param serverTimeOffset - pass in server time offset from native side
 * @returns {string}
 */
export declare function generatePushID(serverTimeOffset?: number): string;
/**
 * Converts a code and message from a native event to a JS Error
 * @param code
 * @param message
 * @param additionalProps
 * @returns {Error}
 */
export declare function nativeToJSError(code: string, message: string, additionalProps?: Object): any;
/**
 *
 * @param object
 * @return {string}
 */
export declare function objectToUniqueId(object: Object): string;
/**
 * Return the existing promise if no callback provided or
 * exec the promise and callback if optionalCallback is valid.
 *
 * @param promise
 * @param optionalCallback
 * @return {Promise}
 */
export declare function promiseOrCallback(promise: Promise<any>, optionalCallback?: Function): Promise<any>;
/**
 * Generate a firestore auto id for use with collection/document .add()
 * @return {string}
 */
export declare function firestoreAutoId(): string;
