import { RequireContextPonyFill } from '../testing-library/require-context-ponyfill';
export type { RequireContextPonyFill } from '../testing-library/require-context-ponyfill';
/**
 * This file is imported via `@expo/cli`. While users should be using the same SDK version of `expo-router` as `@expo/cli`,
 * this export allows us to ensure that the version of the `expo-router` package is compatible with the version of `@expo/cli`.
 */
export declare const version = 52;
/**
 * Generate a Metro watch handler that regenerates the typed routes declaration file
 */
export declare function getWatchHandler(outputDir: string, { ctx, regenerateFn }?: {
    ctx?: RequireContextPonyFill | undefined;
    regenerateFn?: ((outputDir: string, options?: {
        partialTypedGroups?: boolean;
    } | undefined, ctx?: RequireContextPonyFill | undefined) => void) | undefined;
}): ({ filePath, type }: {
    filePath: string;
    type: string;
}) => Promise<void>;
/**
 * Regenerate the declaration file.
 *
 * This function needs to be debounced due to Metro's handling of renaming folders.
 * For example, if you have the file /(tabs)/route.tsx and you rename the folder to /(tabs,test)/route.tsx
 *
 * Metro will fire 2 filesystem events:
 *  - ADD /(tabs,test)/router.tsx
 *  - DELETE /(tabs)/router.tsx
 *
 * If you process the types after the ADD, then they will crash as you will have conflicting routes
 */
export declare const regenerateDeclarations: (outputDir: string, options?: {
    partialTypedGroups?: boolean;
} | undefined, ctx?: RequireContextPonyFill | undefined) => void;
//# sourceMappingURL=index.d.ts.map