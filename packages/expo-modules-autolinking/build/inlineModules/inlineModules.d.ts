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
export interface InlineModulesScanOptions {
    watchedDirectories: string[];
    appRoot: string;
}
/**
 * Checks if the fileName is valid for inline module scanning.
 * Swift and Kotlin files are classified as modules by reading their contents.
 */
export declare function inlineModuleFileNameInformation(fileName: string): {
    valid: boolean;
    ext: string;
};
/**
 * Information about a Kotlin file relevant to inline module registration.
 */
export interface KotlinInlineModuleInfo {
    /** Whether the file defines an inline module (contains an `override fun definition() = .*ModuleDefinition`). */
    hasModuleDefinition: boolean;
    /** `<package>.<fileName>` when the file is a module and its `package` was found, otherwise `null`. */
    classNameWithPackage: string | null;
}
/**
 * Reads a Kotlin file once and derives both whether it defines an inline module and, if so, its
 * `<package>.<fileName>` class name.
 */
export declare function getKotlinInlineModuleInfo(absoluteFilePath: string): Promise<KotlinInlineModuleInfo>;
export declare function getSwiftModuleClassName(absoluteFilePath: string): string;
export declare function hasSwiftModuleDefinition(absoluteFilePath: string): Promise<boolean>;
/**
 * Scans the project and returns information about all of the inline modules inside in an InlineModulesMirror object.
 */
export declare function getMirrorStateObject(options: InlineModulesScanOptions): Promise<InlineModulesMirror>;
