import { ParsedURL, SendIntentExtras, URLListener } from './Linking.types';
export declare function addEventListener(type: 'url', handler: URLListener): {
    remove(): void;
};
export declare function parseInitialURLAsync(): Promise<ParsedURL>;
export declare function sendIntent(action: string, extras?: SendIntentExtras[]): Promise<void>;
export declare function openSettings(): Promise<void>;
export declare function getInitialURL(): Promise<string | null>;
export declare function getLinkingURL(): string;
export declare function openURL(url: string): Promise<true>;
export declare function canOpenURL(): Promise<boolean>;
export declare function useURL(): string | null;
export declare function useLinkingURL(): null;
export * from './Linking.types';
export declare function collectManifestSchemes(): never[];
export declare function hasConstantsManifest(): boolean;
export declare function hasCustomScheme(): boolean;
export declare function resolveScheme(): string;
export { parse, createURL } from './createURL';
//# sourceMappingURL=Linking.server.d.ts.map