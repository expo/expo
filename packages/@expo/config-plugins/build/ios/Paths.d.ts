interface ProjectFile<L extends string = string> {
    path: string;
    language: L;
    contents: string;
}
type AppleLanguage = 'objc' | 'objcpp' | 'swift' | 'rb';
export type PodfileProjectFile = ProjectFile<'rb'>;
export type AppDelegateProjectFile = ProjectFile<AppleLanguage>;
export declare function getAppDelegateHeaderFilePath(projectRoot: string): string;
export declare function getAppDelegateFilePath(projectRoot: string): string;
export declare function getAppDelegateObjcHeaderFilePath(projectRoot: string): string;
export declare function getPodfilePath(projectRoot: string): string;
export declare function getFileInfo(filePath: string): {
    path: string;
    contents: string;
    language: AppleLanguage;
};
export declare function getAppDelegate(projectRoot: string): AppDelegateProjectFile;
export declare function getSourceRoot(projectRoot: string): string;
export declare function findSchemePaths(projectRoot: string): string[];
export declare function findSchemeNames(projectRoot: string): string[];
export declare function getAllXcodeProjectPaths(projectRoot: string): string[];
/**
 * Get the pbxproj for the given path
 */
export declare function getXcodeProjectPath(projectRoot: string): string;
export declare function getAllPBXProjectPaths(projectRoot: string): string[];
export declare function getPBXProjectPath(projectRoot: string): string;
export declare function getAllInfoPlistPaths(projectRoot: string): string[];
export declare function getInfoPlistPath(projectRoot: string): string;
export declare function getAllEntitlementsPaths(projectRoot: string): string[];
/**
 * @deprecated: use Entitlements.getEntitlementsPath instead
 */
export declare function getEntitlementsPath(projectRoot: string): string | null;
export declare function getSupportingPath(projectRoot: string): string;
export declare function getExpoPlistPath(projectRoot: string): string;
export {};
