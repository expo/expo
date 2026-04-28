import { XcodeProject } from 'expo/config-plugins';

export function addPbxGroup(
  xcodeProject: XcodeProject,
  {
    targetName,
    widgetFiles,
  }: {
    targetName: string;
    widgetFiles: string[];
  }
) {
  // Add PBX group
  const { uuid: pbxGroupUuid } = xcodeProject.addPbxGroup(
    [...widgetFiles, `${targetName}.entitlements`],
    targetName,
    targetName
  );

  // Add PBXGroup to top level group
  const groups = xcodeProject.hash.project.objects['PBXGroup'];
  if (pbxGroupUuid) {
    Object.keys(groups).forEach(function (key) {
      if (groups[key]!.name === undefined && groups[key]!.path === undefined) {
        // @ts-expect-error: TODO(@kitten): This was untyped before and is now failing
        xcodeProject.addToPbxGroup(pbxGroupUuid, key);
      }
    });
  }
}
