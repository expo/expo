import { XcodeProject } from 'xcode';

import { getXCBuildConfigurationFromPbxproj } from '../Target';
import { resolvePathOrProject } from './Xcodeproj';

/**
 * Find the Info.plist path linked to a specific build configuration.
 *
 * @param projectRoot
 * @param param1
 * @returns
 */
export function getInfoPlistPathFromPbxproj(
  projectRootOrProject: string | XcodeProject,
  {
    targetName,
    buildConfiguration = 'Release',
  }: { targetName?: string; buildConfiguration?: string | 'Release' | 'Debug' } = {}
): string | null {
  const project = resolvePathOrProject(projectRootOrProject);
  if (!project) {
    return null;
  }

  const xcBuildConfiguration = getXCBuildConfigurationFromPbxproj(project, {
    targetName,
    buildConfiguration,
  });
  if (!xcBuildConfiguration) {
    return null;
  }
  // The `INFOPLIST_FILE` is relative to the project folder, ex: app/Info.plist.
  return sanitizeInfoPlistBuildProperty(xcBuildConfiguration.buildSettings.INFOPLIST_FILE);
}

function sanitizeInfoPlistBuildProperty(infoPlist?: string): string | null {
  return infoPlist?.replace(/"/g, '').replace('$(SRCROOT)', '') ?? null;
}
