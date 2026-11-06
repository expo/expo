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
  if (xcodeProject.pbxGroupByName(targetName)) {
    return;
  }

  const groupFiles = Array.from(new Set([...widgetFiles, `${targetName}.entitlements`]));

  // Add PBX group
  const { uuid: pbxGroupUuid, pbxGroup } = xcodeProject.addPbxGroup(
    groupFiles.filter((file) => file !== 'Info.plist'),
    targetName,
    targetName
  );

  // `addPbxGroup` reuses a file reference that has the same path, such as the `Info.plist` of
  // another extension. Xcode 27 refuses a project that has a file reference in more than one group.
  if (groupFiles.includes('Info.plist')) {
    const infoPlistReference = xcodeProject.generateUuid();
    xcodeProject.addToPbxFileReferenceSection({
      fileRef: infoPlistReference,
      basename: 'Info.plist',
      path: 'Info.plist',
      sourceTree: '"<group>"',
      fileEncoding: 4,
      lastKnownFileType: 'text.plist.xml',
      includeInIndex: 0,
    });
    pbxGroup.children.push({ value: infoPlistReference, comment: 'Info.plist' });
  }

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
