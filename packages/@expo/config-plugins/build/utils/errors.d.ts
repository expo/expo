export declare class UnexpectedError extends Error {
    readonly name = "UnexpectedError";
    constructor(message: string);
}
export declare type PluginErrorCode = 'INVALID_PLUGIN_TYPE' | 'INVALID_PLUGIN_IMPORT' | 'PLUGIN_NOT_FOUND' | 'CONFLICTING_PROVIDER' | 'INVALID_MOD_ORDER' | 'MISSING_PROVIDER';
/**
 * Based on `JsonFileError` from `@expo/json-file`
 */
export declare class PluginError extends Error {
    code: PluginErrorCode;
    cause?: Error | undefined;
    readonly name = "PluginError";
    readonly isPluginError = true;
    constructor(message: string, code: PluginErrorCode, cause?: Error | undefined);
}
