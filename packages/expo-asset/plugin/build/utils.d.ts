export declare const IMAGE_TYPES: string[];
export declare const FONT_TYPES: string[];
export declare const MEDIA_TYPES: string[];
export declare const ACCEPTED_TYPES: string[];
export declare function resolveAssetPaths(assets: string[], projectRoot: string): Promise<string[]>;
export declare function validateAssets(assets: string[], platform: 'android' | 'ios'): string[];
