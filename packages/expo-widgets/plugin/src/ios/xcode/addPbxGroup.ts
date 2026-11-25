import { XcodeProject } from 'expo/config-plugins';
import type { PBXGroup } from 'xcode';

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

  // Add PBX group
  const { uuid: pbxGroupUuid, pbxGroup } = xcodeProject.addPbxGroup(
    Array.from(new Set([...widgetFiles, `${targetName}.entitlements`])),
    targetName,
    targetName
  );
  copyFileReferencesFromOtherGroups(xcodeProject, pbxGroup);

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

// `addPbxGroup` reuses any file reference with the same path, also one in the group of another
// target, such as the `Info.plist` of `expo-sharing`. Xcode 27 refuses a file reference that is in
// more than one group.
function copyFileReferencesFromOtherGroups(xcodeProject: XcodeProject, pbxGroup: PBXGroup) {
  const { PBXGroup: groups, PBXFileReference: fileReferences } = xcodeProject.hash.project.objects;

  // Collect the file reference UUIDs of all other groups. The section also has a
  // `<uuid>_comment` string for each group, so skip the values that are not objects.
  const fileReferencesInOtherGroups = new Set(
    Object.values(groups)
      .filter((group) => group !== pbxGroup && typeof group === 'object')
      .flatMap((group) => group.children.map(({ value }: { value: string }) => value))
  );

  for (const child of pbxGroup.children) {
    const fileReference = fileReferences[child.value];
    // Keep the file references that no other group uses.
    if (!fileReference || !fileReferencesInOtherGroups.has(child.value)) {
      continue;
    }

    // Add a copy of the file reference with a new UUID, and make this group use the copy.
    const uuid = xcodeProject.generateUuid();
    fileReferences[uuid] = { ...fileReference };
    const comment = fileReferences[`${child.value}_comment`];
    if (comment) {
      fileReferences[`${uuid}_comment`] = comment;
    }
    child.value = uuid;
  }
}
