import { RequireContextPonyFill } from '../testing-library/require-context-ponyfill';
export type { RequireContextPonyFill } from '../testing-library/require-context-ponyfill';
/**
 * Generate a Metro watch handler that regenerates the typed routes declaration file
 */
export declare function getWatchHandler(outputDir: string, { ctx, regenerateFn }?: {
    ctx?: RequireContextPonyFill | undefined;
    regenerateFn?: ((outputDir: string, ctx?: RequireContextPonyFill | undefined) => void) | undefined;
}): ({ filePath, type }: {
    filePath: string;
    type: string;
}) => Promise<void>;
/**
 * A throttled function that regenerates the typed routes declaration file
 */
export declare const regenerateDeclarations: (outputDir: string, ctx?: RequireContextPonyFill | undefined) => void;
//# sourceMappingURL=index.d.ts.map