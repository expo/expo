import { AppJSONConfig, ConfigContext, ExpoConfig } from './Config.types';
declare type RawDynamicConfig = AppJSONConfig | Partial<ExpoConfig> | null;
export declare type DynamicConfigResults = {
    config: RawDynamicConfig;
    exportedObjectType: string;
};
/**
 * Transpile and evaluate the dynamic config object.
 * This method is shared between the standard reading method in getConfig, and the headless script.
 *
 * @param options configFile path to the dynamic app.config.*, request to send to the dynamic config if it exports a function.
 * @returns the serialized and evaluated config along with the exported object type (object or function).
 */
export declare function evalConfig(configFile: string, request: ConfigContext | null): DynamicConfigResults;
/**
 * - Resolve the exported contents of an Expo config (be it default or module.exports)
 * - Assert no promise exports
 * - Return config type
 * - Serialize config
 *
 * @param result
 * @param configFile
 * @param request
 */
export declare function resolveConfigExport(result: any, configFile: string, request: ConfigContext | null): {
    config: any;
    exportedObjectType: "string" | "number" | "bigint" | "boolean" | "symbol" | "undefined" | "object" | "function";
};
export {};
