/**
 * Generate a Metro watch handler that regenerates the typed routes declaration file
 */
export declare function getWatchHandler(outputDir: string): ({ filePath, type }: {
    filePath: string;
    type: string;
}) => Promise<void>;
/**
 * A throttled function that regenerates the typed routes declaration file
 */
export declare const regenerateDeclarations: (outputDir: string) => void;
//# sourceMappingURL=index.d.ts.map