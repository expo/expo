import { XcodeProject } from 'xcode';
/**
 * Find the Info.plist path linked to a specific build configuration.
 *
 * @param projectRoot
 * @param param1
 * @returns
 */
export declare function getInfoPlistPathFromPbxproj(projectRootOrProject: string | XcodeProject, { targetName, buildConfiguration, }?: {
    targetName?: string;
    buildConfiguration?: string | 'Release' | 'Debug';
}): string | null;
