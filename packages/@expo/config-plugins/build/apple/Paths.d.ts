interface ProjectFile<L extends string = string> {
    path: string;
    language: L;
    contents: string;
}
type AppleLanguage = 'objc' | 'objcpp' | 'swift' | 'rb';
export type PodfileProjectFile = ProjectFile<'rb'>;
export type AppDelegateProjectFile = ProjectFile<AppleLanguage>;
export declare const getAppDelegateHeaderFilePath: (applePlatform: 'ios' | 'macos') => (projectRoot: string) => string;
export declare const getAppDelegateFilePath: (applePlatform: 'ios' | 'macos') => (projectRoot: string) => string;
export declare const getAppDelegateObjcHeaderFilePath: (applePlatform: 'ios' | 'macos') => (projectRoot: string) => string;
export declare const getPodfilePath: (applePlatform: 'ios' | 'macos') => (projectRoot: string) => string;
export declare function getFileInfo(filePath: string): {
    path: string;
    contents: string;
    language: AppleLanguage;
};
export declare const getAppDelegate: (applePlatform: 'ios' | 'macos') => (projectRoot: string) => AppDelegateProjectFile;
export declare const getSourceRoot: (applePlatform: 'ios' | 'macos') => (projectRoot: string) => string;
export declare const findSchemePaths: (applePlatform: 'ios' | 'macos') => (projectRoot: string) => string[];
export declare const findSchemeNames: (applePlatform: 'ios' | 'macos') => (projectRoot: string) => string[];
export declare const getAllXcodeProjectPaths: (applePlatform: 'ios' | 'macos') => (projectRoot: string) => string[];
/**
 * Get the pbxproj for the given path
 */
export declare const getXcodeProjectPath: (applePlatform: 'ios' | 'macos') => (projectRoot: string) => string;
export declare const getAllPBXProjectPaths: (applePlatform: 'ios' | 'macos') => (projectRoot: string) => string[];
export declare const getPBXProjectPath: (applePlatform: 'ios' | 'macos') => (projectRoot: string) => string;
export declare const getAllInfoPlistPaths: (applePlatform: 'ios' | 'macos') => (projectRoot: string) => string[];
export declare const getInfoPlistPath: (applePlatform: 'ios' | 'macos') => (projectRoot: string) => string;
export declare const getAllEntitlementsPaths: (applePlatform: 'ios' | 'macos') => (projectRoot: string) => string[];
/**
 * @deprecated: use Entitlements.getEntitlementsPath instead
 */
export declare const getEntitlementsPath: (applePlatform: 'ios' | 'macos') => (projectRoot: string) => string | null;
export declare const getSupportingPath: (applePlatform: 'ios' | 'macos') => (projectRoot: string) => string;
export declare const getExpoPlistPath: (applePlatform: 'ios' | 'macos') => (projectRoot: string) => string;
export {};
