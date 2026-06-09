import { IOSConfig } from '@expo/config-plugins';
import fs from 'fs';
import path from 'path';

export interface InlineModulesXcodeParams {
  watchedDirectories: string[];
  /**
   * List of targets to which add watchedDirectories. If undefined default to all targets.
   */
  xcodeProjectTargets?: string[];
}

type UUID = string;

function getNativeTargetSynchronizedGroupsMap(pbxProject: any) {
  const objects = pbxProject.hash.project.objects;
  const nativeTargetSynchronizedGroups = new Map<UUID, Set<UUID>>();

  for (const target of pbxProject.getFirstProject().firstProject.targets) {
    const nativeTargetGroup = objects.PBXNativeTarget[target.value];
    const synchronizedGroups = new Set<UUID>();

    if (nativeTargetGroup.fileSystemSynchronizedGroups) {
      for (const synchronizedGroup of nativeTargetGroup.fileSystemSynchronizedGroups) {
        synchronizedGroups.add(synchronizedGroup.value);
      }
    }
    nativeTargetSynchronizedGroups.set(target.value, synchronizedGroups);
  }
  return nativeTargetSynchronizedGroups;
}

function prepareSynchronizedRootGroups(pbxProject: any): {
  fsSynchronizedRootGroups: Map<string, UUID>;
  fsSynchronizedRootGroupsUUIDs: Set<UUID>;
} {
  const objects = pbxProject.hash.project.objects;
  const fsSynchronizedRootGroups = new Map<string, UUID>();
  const fsSynchronizedRootGroupsUUIDs = new Set<UUID>();
  if (objects.PBXFileSystemSynchronizedRootGroup) {
    for (const key of Object.keys(objects.PBXFileSystemSynchronizedRootGroup)) {
      if (key.endsWith('_comment')) {
        continue;
      }
      const groupObject = objects.PBXFileSystemSynchronizedRootGroup[key];
      fsSynchronizedRootGroups.set(groupObject.path, key);
      fsSynchronizedRootGroupsUUIDs.add(key);
    }
  } else {
    objects.PBXFileSystemSynchronizedRootGroup = {};
  }
  return { fsSynchronizedRootGroups, fsSynchronizedRootGroupsUUIDs };
}

/**
 * Add watched directories as PBXFileSystemSynchronizedRootGroups to pbxproj file in the project and save the changes.
 */
export async function updateXcodeProject(
  projectRoot: string,
  inlineModulesXcodeParams: InlineModulesXcodeParams
): Promise<void> {
  const swiftWatchedDirectories = inlineModulesXcodeParams.watchedDirectories;
  const xcodeProjectTargets = inlineModulesXcodeParams.xcodeProjectTargets
    ? new Set(inlineModulesXcodeParams.xcodeProjectTargets)
    : undefined;

  // Only perform changes to pbxproj if necessary
  if (swiftWatchedDirectories.length === 0) {
    return;
  }

  const pbxProject = IOSConfig.XcodeUtils.getPbxproj(projectRoot);
  const mainGroupUUID = pbxProject.getFirstProject().firstProject.mainGroup;
  const objects = pbxProject.hash.project.objects;
  const projectRootRelativeToIos = '..';
  const pbxNativeTarget = pbxProject.hash.project.objects.PBXNativeTarget;

  const { fsSynchronizedRootGroups, fsSynchronizedRootGroupsUUIDs } =
    prepareSynchronizedRootGroups(pbxProject);
  const nativeTargetSynchronizedGroups = getNativeTargetSynchronizedGroupsMap(pbxProject);

  const removeWatchedDirectoriesFromTarget = (nativeTargetGroup: any) => {
    if (!nativeTargetGroup.fileSystemSynchronizedGroups) {
      return;
    }
    nativeTargetGroup.fileSystemSynchronizedGroups =
      nativeTargetGroup.fileSystemSynchronizedGroups.filter(
        (group: any) => !fsSynchronizedRootGroupsUUIDs.has(group.value)
      );
  };

  const addWatchedDirectoryToTarget = (
    targetUUID: UUID,
    nativeTargetGroup: any,
    dir: string,
    dirUUID: any
  ) => {
    if (nativeTargetSynchronizedGroups.get(targetUUID)?.has(dirUUID)) {
      return;
    }
    if (!nativeTargetGroup.fileSystemSynchronizedGroups) {
      nativeTargetGroup.fileSystemSynchronizedGroups = [];
    }
    nativeTargetGroup.fileSystemSynchronizedGroups.push({ value: dirUUID, comment: dir });
  };

  const getOrCreateWatchedDirUUID = (dir: string) => {
    const dirRelativeToIos = path.join(projectRootRelativeToIos, dir);
    if (fsSynchronizedRootGroups.has(dirRelativeToIos)) {
      return fsSynchronizedRootGroups.get(dirRelativeToIos);
    }

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
    return newUUID;
  };

  for (const target of pbxProject.getFirstProject().firstProject.targets) {
    const targetUuid = target.value;
    const targetName = pbxNativeTarget[targetUuid].name;
    const nativeTargetGroup = objects.PBXNativeTarget[target.value];
    if (xcodeProjectTargets && !xcodeProjectTargets.has(targetName)) {
      removeWatchedDirectoriesFromTarget(nativeTargetGroup);
      continue;
    }
    for (const dir of swiftWatchedDirectories) {
      const dirUUID = getOrCreateWatchedDirUUID(dir);
      addWatchedDirectoryToTarget(target.value, nativeTargetGroup, dir, dirUUID);
    }
  }

  await fs.promises.writeFile(pbxProject.filepath, pbxProject.writeSync());
}
