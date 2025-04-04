import { ModPlatform } from '../Plugin.types';
interface ProjectFile<L extends string = string> {
    path: string;
    language: L;
    contents: string;
}
type AppleLanguage = 'objc' | 'objcpp' | 'swift' | 'rb';
export type PodfileProjectFile = ProjectFile<'rb'>;
export type AppDelegateProjectFile = ProjectFile<AppleLanguage>;
export declare function getAppDelegateHeaderFilePath(projectRoot: string, platform: ModPlatform): string;
export declare function getAppDelegateFilePath(projectRoot: string, platform: ModPlatform): string;
export declare function getAppDelegateObjcHeaderFilePath(projectRoot: string, platform: ModPlatform): string;
export declare function getPodfilePath(projectRoot: string, platform: ModPlatform): string;
export declare function getFileInfo(filePath: string): {
    path: string;
    contents: string;
    language: AppleLanguage;
};
export declare function getAppDelegate(projectRoot: string, platform: ModPlatform): AppDelegateProjectFile;
export declare function getSourceRoot(projectRoot: string, platform: ModPlatform): string;
export declare function findSchemePaths(projectRoot: string, platform: ModPlatform): string[];
export declare function findSchemeNames(projectRoot: string, platform: ModPlatform): string[];
export declare function getAllXcodeProjectPaths(projectRoot: string, platform: ModPlatform): string[];
/**
 * Get the pbxproj for the given path
 */
export declare function getXcodeProjectPath(projectRoot: string, platform: ModPlatform): string;
export declare function getAllPBXProjectPaths(projectRoot: string, platform: ModPlatform): string[];
export declare function getPBXProjectPath(projectRoot: string, platform: ModPlatform): string;
export declare function getAllInfoPlistPaths(projectRoot: string, platform: ModPlatform): string[];
export declare function getInfoPlistPath(projectRoot: string, platform: ModPlatform): string;
export declare function getAllEntitlementsPaths(projectRoot: string, platform: ModPlatform): string[];
/**
 * @deprecated: use Entitlements.getEntitlementsPath instead
 */
export declare function getEntitlementsPath(projectRoot: string, platform: ModPlatform): string | null;
export declare function getSupportingPath(projectRoot: string, platform: ModPlatform): string;
export declare function getExpoPlistPath(projectRoot: string, platform: ModPlatform): string;
export {};
