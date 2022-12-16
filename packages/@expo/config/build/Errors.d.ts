import { ConfigErrorCode } from './Config.types';
/**
 * Based on `JsonFileError` from `@expo/json-file`
 */
export declare class ConfigError extends Error {
    code: ConfigErrorCode;
    cause?: Error | undefined;
    readonly name = "ConfigError";
    readonly isConfigError = true;
    constructor(message: string, code: ConfigErrorCode, cause?: Error | undefined);
}
