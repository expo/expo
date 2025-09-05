import { ExpoConfig } from './Config.types';
export declare function withInternalGeneratedConfig(projectRoot: string, config: ExpoConfig): ExpoConfig;
export declare function getStaticGeneratedConfigPath(projectRoot: string): string;
export declare function getGeneratedConfigPath(projectRoot: string): string | null;
export declare function appendShallowGeneratedConfig(appendedValues: Record<string, unknown>, { projectRoot }: {
    projectRoot: string;
}): boolean;
