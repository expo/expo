export declare const loadPromises: {
    [name: string]: Promise<void>;
};
export declare function markLoaded(fontFamily: string): void;
export declare function isLoadedInCache(fontFamily: string): boolean;
export declare function isLoadedNative(fontFamily: string): boolean;
export declare function purgeFontFamilyFromCache(fontFamily: string): void;
export declare function purgeCache(): void;
//# sourceMappingURL=memory.d.ts.map