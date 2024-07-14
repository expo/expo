import { XcodeProject } from 'xcode';
/**
 * Find the Info.plist path linked to a specific build configuration.
 *
 * @param projectRoot
 * @param param1
 * @returns
 */
export declare const getInfoPlistPathFromPbxproj: (applePlatform: 'ios' | 'macos') => (projectRootOrProject: string | XcodeProject, { targetName, buildConfiguration, }?: {
    targetName?: string | undefined;
    buildConfiguration?: string | undefined;
}) => string | null;
