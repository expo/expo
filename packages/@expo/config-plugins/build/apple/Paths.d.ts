interface ProjectFile<L extends string = string> {
    path: string;
    language: L;
    contents: string;
}
type AppleLanguage = 'objc' | 'objcpp' | 'swift' | 'rb';
export type PodfileProjectFile = ProjectFile<'rb'>;
export type AppDelegateProjectFile = ProjectFile<AppleLanguage>;
export declare function getAppDelegateHeaderFilePath(projectRoot: string, applePlatform: 'ios' | 'macos'): string;
export declare function getAppDelegateFilePath(projectRoot: string, applePlatform: 'ios' | 'macos'): string;
export declare function getAppDelegateObjcHeaderFilePath(projectRoot: string, applePlatform: 'ios' | 'macos'): string;
export declare function getPodfilePath(projectRoot: string, applePlatform: 'ios' | 'macos'): string;
export declare function getFileInfo(filePath: string): {
    path: string;
    contents: string;
    language: AppleLanguage;
};
export declare function getAppDelegate(projectRoot: string, applePlatform: 'ios' | 'macos'): AppDelegateProjectFile;
export declare function getSourceRoot(projectRoot: string, applePlatform: 'ios' | 'macos'): string;
export declare function findSchemePaths(projectRoot: string, applePlatform: 'ios' | 'macos'): string[];
export declare function findSchemeNames(projectRoot: string, applePlatform: 'ios' | 'macos'): string[];
export declare function getAllXcodeProjectPaths(projectRoot: string, applePlatform: 'ios' | 'macos'): string[];
/**
 * Get the pbxproj for the given path
 */
export declare function getXcodeProjectPath(projectRoot: string, applePlatform: 'ios' | 'macos'): string;
export declare function getAllPBXProjectPaths(projectRoot: string, applePlatform: 'ios' | 'macos'): string[];
export declare function getPBXProjectPath(projectRoot: string, applePlatform: 'ios' | 'macos'): string;
export declare function getAllInfoPlistPaths(projectRoot: string, applePlatform: 'ios' | 'macos'): string[];
export declare function getInfoPlistPath(projectRoot: string, applePlatform: 'ios' | 'macos'): string;
export declare function getAllEntitlementsPaths(projectRoot: string, applePlatform: 'ios' | 'macos'): string[];
/**
 * @deprecated: use Entitlements.getEntitlementsPath instead
 */
export declare function getEntitlementsPath(projectRoot: string, applePlatform: 'ios' | 'macos'): string | null;
export declare function getSupportingPath(projectRoot: string, applePlatform: 'ios' | 'macos'): string;
export declare function getExpoPlistPath(projectRoot: string, applePlatform: 'ios' | 'macos'): string;
export {};
