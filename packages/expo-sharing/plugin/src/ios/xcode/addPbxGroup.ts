import { XcodeProject } from '@expo/config-plugins';
import path from 'path';
import type { PBXGroup } from 'xcode';

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

  const { uuid: mainGroupUuid, pbxGroup: mainGroup } = xcodeProject.addPbxGroup(
    targetFiles,
    targetName,
    targetName
  );
  copyFileReferencesFromOtherGroups(xcodeProject, mainGroup);
  const { uuid: sharedGroupUuid } = xcodeProject.addPbxGroup(sharedFiles, 'shared', 'shared');

  if (mainGroupUuid && sharedGroupUuid) {
    // @ts-expect-error: TODO(@kitten): This used to be untyped, and is failing now
    xcodeProject.addToPbxGroup(sharedGroupUuid, mainGroupUuid);
  }

  const groups = xcodeProject.hash.project.objects['PBXGroup'];
  if (mainGroupUuid) {
    Object.keys(groups).forEach((key) => {
      if (!groups[key]!.name && !groups[key]!.path) {
        // @ts-expect-error: TODO(@kitten): This used to be untyped, and is failing now
        xcodeProject.addToPbxGroup(mainGroupUuid, key);
      }
    });
  }
}

// `addPbxGroup` reuses any file reference with the same path, also one in the group of another
// target, such as the `Info.plist` of `expo-widgets`. Xcode 27 refuses a file reference that is in
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
