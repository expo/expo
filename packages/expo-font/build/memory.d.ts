export declare const loadPromises: {
    [name: string]: Promise<void>;
};
export declare const markLoaded: (fontFamily: string) => void;
export declare const isLoadedInCache: (fontFamily: string) => boolean;
export declare const isLoadedNative: (fontFamily: string) => boolean;
export declare const purgeFontFamilyFromCache: (fontFamily: string) => void;
export declare const purgeCache: () => void;
//# sourceMappingURL=memory.d.ts.map