import { XcodeProject } from '@expo/config-plugins';
import path from 'path';

import { getSharedFilesPath } from '../../utils';
import { ShareExtensionFiles } from '../setupShareExtensionFiles';

export function addBuildPhases(
  xcodeProject: XcodeProject,
  targetUuid: string,
  targetName: string,
  groupName: string,
  productFile: {
    uuid: string;
    target: string;
    basename: string;
    group: string;
  },
  shareExtensionFiles: ShareExtensionFiles,
  platformProjectRoot: string
) {
  const buildPath = `""`;
  const sharedFilesPath = getSharedFilesPath();
  const folderType = 'app_extension';

  const { swiftFiles, intentFiles, assetDirectories, sharedFiles } = shareExtensionFiles;

  // Gets the location of the shared files relative to the extension directory
  const sharedSwiftFiles =
    sharedFiles?.swiftFiles
      .map((file) => path.join(sharedFilesPath, file))
      .map((file) => {
        const shareExtensionDirectory = path.join(platformProjectRoot, targetName, 'shared');
        return path.relative(shareExtensionDirectory, file);
      }) || [];

  xcodeProject.addBuildPhase(
    [...swiftFiles, ...intentFiles, ...sharedSwiftFiles],
    'PBXSourcesBuildPhase',
    groupName,
    targetUuid,
    folderType,
    buildPath
  );

  xcodeProject.addBuildPhase(
    [],
    'PBXCopyFilesBuildPhase',
    groupName,
    xcodeProject.getFirstTarget().uuid,
    folderType,
    buildPath
  );

  xcodeProject
    .buildPhaseObject('PBXCopyFilesBuildPhase', groupName, productFile.target)
    .files.push({
      value: productFile.uuid,
      comment: `${productFile.basename} in ${productFile.group}`,
    });

  xcodeProject.addToPbxBuildFileSection(productFile);

  xcodeProject.addBuildPhase(
    [],
    'PBXFrameworksBuildPhase',
    groupName,
    targetUuid,
    folderType,
    buildPath
  );

  xcodeProject.addBuildPhase(
    [...assetDirectories],
    'PBXResourcesBuildPhase',
    groupName,
    targetUuid,
    folderType,
    buildPath
  );
}
