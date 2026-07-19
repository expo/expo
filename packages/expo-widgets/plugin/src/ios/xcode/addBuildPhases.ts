import { XcodeProject } from 'expo/config-plugins';
import type { PBXFile } from 'xcode';

type BuildPhase = {
  files: { value: string; comment: string }[];
};

type BuildPhaseType = 'PBXSourcesBuildPhase' | 'PBXCopyFilesBuildPhase' | 'PBXFrameworksBuildPhase';

type ProductFile = PBXFile & {
  uuid: string;
  target: string;
  basename: string;
  group: string;
};

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
    productFile: ProductFile;
    widgetFiles: string[];
  }
) {
  const buildPath = `""`;
  const folderType = 'app_extension';
  const mainTargetUuid = xcodeProject.getFirstTarget().uuid;

  // Sources build phase
  if (!getBuildPhaseObject(xcodeProject, 'PBXSourcesBuildPhase', targetUuid)) {
    xcodeProject.addBuildPhase(
      [...widgetFiles],
      'PBXSourcesBuildPhase',
      'Sources',
      targetUuid,
      folderType,
      buildPath
    );
  }

  // Copy files build phase
  if (!getBuildPhaseObject(xcodeProject, 'PBXCopyFilesBuildPhase', mainTargetUuid, groupName)) {
    xcodeProject.addBuildPhase(
      [],
      'PBXCopyFilesBuildPhase',
      groupName,
      mainTargetUuid,
      folderType,
      buildPath
    );
  }

  const copyFilesBuildPhase = getBuildPhaseObject(
    xcodeProject,
    'PBXCopyFilesBuildPhase',
    mainTargetUuid,
    groupName
  );
  if (
    copyFilesBuildPhase &&
    !copyFilesBuildPhase.files.some((file: { value: string }) => file.value === productFile.uuid)
  ) {
    copyFilesBuildPhase.files.push({
      value: productFile.uuid,
      comment: `${productFile.basename} in ${productFile.group}`,
    });
  }
  if (!xcodeProject.pbxBuildFileSection()[productFile.uuid]) {
    xcodeProject.addToPbxBuildFileSection(productFile);
  }

  // Frameworks build phase
  if (!getBuildPhaseObject(xcodeProject, 'PBXFrameworksBuildPhase', targetUuid)) {
    xcodeProject.addBuildPhase(
      [],
      'PBXFrameworksBuildPhase',
      'Frameworks',
      targetUuid,
      folderType,
      buildPath
    );
  }
}

function getBuildPhaseObject(
  xcodeProject: XcodeProject,
  buildPhaseType: BuildPhaseType,
  targetUuid: string,
  comment?: string
): BuildPhase | null {
  const objects = xcodeProject.hash.project.objects as Record<string, Record<string, unknown>>;
  const buildPhaseSection = objects[buildPhaseType];
  const target = xcodeProject.pbxNativeTargetSection()[targetUuid];
  if (!buildPhaseSection || !target?.buildPhases) {
    return null;
  }

  const buildPhase = target.buildPhases.find(
    (buildPhase: { value: string; comment: string }) =>
      (!comment || buildPhase.comment === comment) && buildPhaseSection[buildPhase.value]
  );

  return buildPhase ? (buildPhaseSection[buildPhase.value] as BuildPhase) : null;
}
