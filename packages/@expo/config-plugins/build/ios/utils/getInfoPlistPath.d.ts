import { XcodeProject } from 'xcode';
import { ModPlatform } from '../../Plugin.types';
/**
 * Find the Info.plist path linked to a specific build configuration.
 *
 * @param projectRoot
 * @param param1
 * @returns
 */
export declare function getInfoPlistPathFromPbxproj(projectRootOrProject: string | XcodeProject, platform: ModPlatform, { targetName, buildConfiguration, }?: {
    targetName?: string;
    buildConfiguration?: string | 'Release' | 'Debug';
}): string | null;
