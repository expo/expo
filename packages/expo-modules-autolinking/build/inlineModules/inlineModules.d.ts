/**
 * For a given project contains information about all of the inline modules inside.
 * - files: array of files and the watchedDirectories they come from
 * - swiftModuleClassNames: array of swift inline modules class names.
 * - kotlinClasses: array of kotlin inline modules in format `<package>.<className>`
 */
export interface InlineModulesMirror {
    files: {
        filePath: string;
        watchedDirRoot: string;
    }[];
    swiftModuleClassNames: string[];
    kotlinClasses: string[];
}
/**
 * Finds the project root - the closest ancestor directory with package.json.
 * @returns path to the project root.
 */
export declare function getAppRoot(): Promise<string>;
/**
 * Scans the project and returns information about all of the inline modules inside in an InlineModulesMirror object.
 */
export declare function getMirrorStateObject(watchedDirectories: string[]): Promise<InlineModulesMirror>;
