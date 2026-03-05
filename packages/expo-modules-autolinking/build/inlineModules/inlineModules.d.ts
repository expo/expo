/**
 * For a given project contains information about all of the inline modules inside.
 * - files: array of files and the watchedDirectories they come from
 * - swiftModuleClassNames: array of swift inline modules class names.
 * - kotlinClasses: array of kotlin inline modules in format `<package>.<className>`
 */
export interface InlineModulesMirror {
    files: {
        filePath: string;
        watchedDir: string;
    }[];
    swiftModuleClassNames: string[];
    kotlinClasses: string[];
}
/**
 * Checks if the fileName is valid for an inline module.
 * It needs to have suported extension and no dots in the basename as the basename has to match the module name.
 */
export declare function inlineModuleFileNameInformation(fileName: string): {
    valid: boolean;
    ext: string;
};
export declare function getKotlinFileNameWithItsPackage(absoluteFilePath: string): Promise<string | null>;
export declare function getSwiftModuleClassName(absoluteFilePath: string): string;
/**
 * Scans the project and returns information about all of the inline modules inside in an InlineModulesMirror object.
 */
export declare function getMirrorStateObject(watchedDirectories: string[], appRoot: string): Promise<InlineModulesMirror>;
