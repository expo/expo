export declare function createModuleMatcher({ folders, moduleIds, }: {
    folders?: string[];
    moduleIds: string[];
}): RegExp;
export declare const createReactNativeMatcher: ({ folders }: {
    folders?: string[] | undefined;
}) => RegExp;
export declare const createExpoMatcher: ({ folders }: {
    folders?: string[] | undefined;
}) => RegExp;
export declare const createKnownCommunityMatcher: ({ folders, moduleIds, }?: {
    folders?: string[] | undefined;
    moduleIds?: string[] | undefined;
}) => RegExp;
