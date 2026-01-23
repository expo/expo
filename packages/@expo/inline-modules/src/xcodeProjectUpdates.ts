import { getConfig } from '@expo/config';
import { IOSConfig } from '@expo/config-plugins';
import fs from 'fs';
import path from 'path';

export async function updateXCodeProject(projectRoot: string): Promise<void> {
  const swiftWatchedDirectories =
    getConfig(projectRoot).exp.experiments?.inlineModules?.watchedDirectories ?? [];

  // Only perform changes to pbxproj if necessary
  if (swiftWatchedDirectories.length === 0) {
    return;
  }

  const pbxProject = IOSConfig.XcodeUtils.getPbxproj(projectRoot);
  const mainGroupUUID = pbxProject.getFirstProject().firstProject.mainGroup;
  const mainTarget = pbxProject.getFirstProject().firstProject.targets[0];
  const iosFolderPath = path.resolve(projectRoot, 'ios');

  const objects = pbxProject.hash.project.objects;

  const dirEntryExists = (dir: string): boolean => {
    if (!objects.PBXFileSystemSynchronizedRootGroup) {
      return false;
    }
    for (const key of Object.keys(objects.PBXFileSystemSynchronizedRootGroup)) {
      if (key.endsWith('_comment')) {
        continue;
      }
      if (
        path.relative(iosFolderPath, path.resolve(projectRoot, dir)) ===
        objects.PBXFileSystemSynchronizedRootGroup[key].path
      ) {
        return true;
      }
    }
    return false;
  };

  for (const dir of swiftWatchedDirectories) {
    if (dirEntryExists(dir)) {
      continue;
    }

    const newUUID = pbxProject.generateUuid();
    objects.PBXGroup[mainGroupUUID].children.push({
      value: newUUID,
      comment: dir,
    });

    if (!objects.PBXFileSystemSynchronizedRootGroup) {
      objects.PBXFileSystemSynchronizedRootGroup = {};
    }

    objects.PBXFileSystemSynchronizedRootGroup[newUUID] = {
      isa: 'PBXFileSystemSynchronizedRootGroup',
      explicitFileTypes: {},
      explicitFolders: [],
      name: dir,
      path: path.relative(iosFolderPath, path.resolve(projectRoot, dir)),
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

  await fs.promises.writeFile(pbxProject.filepath, pbxProject.writeSync());
}
