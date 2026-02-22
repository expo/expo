import { XcodeProject } from '@expo/config-plugins';
import path from 'path';

import { getSharedFilesPath } from '../../utils';
import { ShareExtensionFiles } from '../setupShareExtensionFiles';

export function addPbxGroup(
  xcodeProject: XcodeProject,
  targetName: string,
  shareExtensionFiles: ShareExtensionFiles,
  platformProjectRoot: string
) {
  const sharedFilesPath = getSharedFilesPath();

  const targetFiles = Object.values({
    ...shareExtensionFiles,
    sharedFiles: [],
  }).flat();

  // Add generated files
  targetFiles.push(`${targetName}.entitlements`);
  targetFiles.push(`Info.plist`);

  const sharedFiles = Object.values(shareExtensionFiles.sharedFiles ?? [])
    .flat()
    .map((file) => path.join(sharedFilesPath, file))
    .map((file) => path.relative(path.join(platformProjectRoot, targetName, 'shared'), file));

  const { uuid: mainGroupUuid } = xcodeProject.addPbxGroup(targetFiles, targetName, targetName);
  const { uuid: sharedGroupUuid } = xcodeProject.addPbxGroup(sharedFiles, 'shared', 'shared');

  if (mainGroupUuid && sharedGroupUuid) {
    xcodeProject.addToPbxGroup(sharedGroupUuid, mainGroupUuid);
  }

  const groups = xcodeProject.hash.project.objects['PBXGroup'];
  if (mainGroupUuid) {
    Object.keys(groups).forEach((key) => {
      if (!groups[key].name && !groups[key].path) {
        xcodeProject.addToPbxGroup(mainGroupUuid, key);
      }
    });
  }
}
