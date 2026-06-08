import { type ConfigT } from '@expo/metro/metro-config';
import { type LoadMetroConfigParams } from './resolveMetroUserConfig';
export type { LoadMetroConfigParams } from './resolveMetroUserConfig';
/** Resolves a user Metro config from the given `params.projectRoot` */
export declare function loadUserConfig(params: LoadMetroConfigParams): Promise<ConfigT>;
