export declare type LanguageOptions = {
    isTS: boolean;
    isModern: boolean;
    isReact: boolean;
};
export declare function getExtensions(platforms: string[], extensions: string[], workflows: string[]): string[];
export declare function getLanguageExtensionsInOrder({ isTS, isModern, isReact, }: LanguageOptions): string[];
export declare function getManagedExtensions(platforms: string[], languageOptions?: LanguageOptions): string[];
export declare function getBareExtensions(platforms: string[], languageOptions?: LanguageOptions): string[];
