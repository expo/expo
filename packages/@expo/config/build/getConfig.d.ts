import { AppJSONConfig, ConfigContext, ExpoConfig } from './Config.types';
import { DynamicConfigResults } from './evalConfig';
export declare function getDynamicConfig(configPath: string, request: ConfigContext): DynamicConfigResults;
export declare function getStaticConfig(configPath: string): AppJSONConfig | ExpoConfig;
