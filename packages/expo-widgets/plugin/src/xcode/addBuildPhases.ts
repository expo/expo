import { XcodeProject } from 'expo/config-plugins';

export function addBuildPhases(
  xcodeProject: XcodeProject,
  {
    targetUuid,
    groupName,
    productFile,
    widgetFiles,
  }: {
    targetUuid: string;
    groupName: string;
    productFile: {
      uuid: string;
      target: string;
      basename: string;
      group: string;
    };
    widgetFiles: string[];
  }
) {
  const buildPath = `""`;
  const folderType = 'app_extension';

  // Sources build phase
  xcodeProject.addBuildPhase(
    [...widgetFiles],
    'PBXSourcesBuildPhase',
    groupName,
    targetUuid,
    folderType,
    buildPath
  );

  // Copy files build phase
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

  // Frameworks build phase
  xcodeProject.addBuildPhase(
    [],
    'PBXFrameworksBuildPhase',
    groupName,
    targetUuid,
    folderType,
    buildPath
  );
}
