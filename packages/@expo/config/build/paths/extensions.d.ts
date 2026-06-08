export type LanguageOptions = {
    isTS: boolean;
    isModern: boolean;
    isReact: boolean;
};
export declare function getExtensions(platforms: readonly string[], extensions: readonly string[], workflows: readonly string[]): string[];
export declare function getLanguageExtensionsInOrder({ isTS, isModern, isReact, }: LanguageOptions): string[];
export declare function getBareExtensions(platforms: string[], languageOptions?: LanguageOptions): string[];
/** Expand `extensions` with OOT platform extensions for platform */
export declare function getPlatformExtensions(platform: string, extensions: readonly string[], customPlatformExtensions: readonly string[] | undefined): string[] | null;
