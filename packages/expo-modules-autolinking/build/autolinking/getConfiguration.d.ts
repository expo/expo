import { AutolinkingOptions } from '../commands/autolinkingOptions';
import type { SupportedPlatform } from '../types';
interface GetConfigurationParams {
    autolinkingOptions: AutolinkingOptions & {
        platform: SupportedPlatform;
    };
}
export declare function getConfiguration({ autolinkingOptions, }: GetConfigurationParams): Record<string, any> | undefined;
export {};
