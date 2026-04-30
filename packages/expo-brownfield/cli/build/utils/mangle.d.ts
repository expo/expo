export interface MangleContext {
    podsProjectPath: string;
    podTargetLabels: string[];
    podXcconfigPaths: string[];
    manglePrefix: string;
    xcconfigPath: string;
    specsChecksum: string;
}
/**
 * Entry point invoked by the Ruby shim during `pod install`. Responsibilities:
 *  1. Build the pod targets to iphonesimulator so we have binaries to scan.
 *  2. nm those binaries, filter Swift symbols, and assemble `MANGLING_DEFINES`.
 *  3. Write the mangling xcconfig + patch each pod's xcconfig to consume it.
 *
 * The Ruby shim already short-circuited on a checksum match before reaching
 * here, so this function unconditionally regenerates.
 */
export declare const runMangle: (context: MangleContext, options: {
    verbose: boolean;
}) => Promise<void>;
export declare const isManglingUpToDate: (xcconfigPath: string, expectedChecksum: string) => boolean;
export declare const __testing: {
    isSwiftSymbol: (line: string) => boolean;
    extractClasses: (lines: string[]) => string[];
    extractConstants: (lines: string[]) => string[];
    extractCategorySelectors: (lines: string[], classes: string[]) => string[];
    prefixSelectors: (prefix: string, selectors: string[]) => string[];
};
