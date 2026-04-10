import { IOSConfig } from 'expo/config-plugins';
import fs from 'fs';
import path from 'path';

export interface InlineModulesXcodeParams {
  watchedDirectories: string[];
}

/**
 * Add watched directories as PBXFileSystemSynchronizedRootGroups to pbxproj file in the project and save the changes.
 */
export async function updateXcodeProject(
  projectRoot: string,
  inlineModulesXcodeParams: InlineModulesXcodeParams
): Promise<void> {
  const swiftWatchedDirectories = inlineModulesXcodeParams.watchedDirectories;
  // Only perform changes to pbxproj if necessary
  if (swiftWatchedDirectories.length === 0) {
    return;
  }

  const pbxProject = IOSConfig.XcodeUtils.getPbxproj(projectRoot);
  const mainGroupUUID = pbxProject.getFirstProject().firstProject.mainGroup;
  const mainTarget = pbxProject.getFirstProject().firstProject.targets[0];
  const objects = pbxProject.hash.project.objects;
  const projectRootRelativeToIos = '..';

  const fsSynchronizedRootGroups: Set<string> = new Set<string>();
  if (objects.PBXFileSystemSynchronizedRootGroup) {
    for (const key of Object.keys(objects.PBXFileSystemSynchronizedRootGroup)) {
      if (key.endsWith('_comment')) {
        continue;
      }
      fsSynchronizedRootGroups.add(objects.PBXFileSystemSynchronizedRootGroup[key].path);
    }
  } else {
    objects.PBXFileSystemSynchronizedRootGroup = {};
  }

  let projectHasChanged = false;
  for (const dir of swiftWatchedDirectories) {
    const dirRelativeToIos = path.join(projectRootRelativeToIos, dir);
    if (fsSynchronizedRootGroups.has(dirRelativeToIos)) {
      continue;
    }

    projectHasChanged = true;

    const newUUID = pbxProject.generateUuid();
    objects.PBXGroup[mainGroupUUID].children.push({
      value: newUUID,
      comment: dir,
    });

    objects.PBXFileSystemSynchronizedRootGroup[newUUID] = {
      isa: 'PBXFileSystemSynchronizedRootGroup',
      explicitFileTypes: {},
      explicitFolders: [],
      name: dir,
      path: dirRelativeToIos,
      sourceTree: 'SOURCE_ROOT',
    };

    if (mainTarget) {
      const nativeTargetGroup = objects.PBXNativeTarget[mainTarget.value];
      if (!nativeTargetGroup.fileSystemSynchronizedGroups) {
        nativeTargetGroup.fileSystemSynchronizedGroups = [];
      }
      nativeTargetGroup.fileSystemSynchronizedGroups.push({ value: newUUID, comment: dir });
    }
  }

  if (projectHasChanged) {
    await fs.promises.writeFile(pbxProject.filepath, pbxProject.writeSync());
  }
}
