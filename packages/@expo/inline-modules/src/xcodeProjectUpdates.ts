import { IOSConfig, type XcodeProject } from '@expo/config-plugins';
import fs from 'fs';
import path from 'path';

export interface InlineModulesXcodeParams {
  watchedDirectories: string[];
  /**
   * List of targets to which inline modules files are added. If undefined defaults to the main target only.
   */
  xcodeProjectTargets?: string[];
  /** app config name */
  name: string;
}

type UUID = string;
interface FileSystemSynchronizedGroup {
  fileSystemSynchronizedGroups?: { value: string; comment?: string }[];
}

function escapeXMLCharacters(original: string): string {
  const noAmps = original.replace('&', '&amp;');
  const noLt = noAmps.replace('<', '&lt;');
  const noGt = noLt.replace('>', '&gt;');
  const noApos = noGt.replace('"', '\\"');
  return noApos.replace("'", "\\'");
}

// Note that this main target name is based on how `@expo/cli/src/prebuild/renameTemplateAppNameAsync.ts` preprocesses the ios project template.
// It is neccesary to match the target name in the path to ExpoModulesProvider.swift for the main target as is used when generating it.
function getMainTargetName(config: InlineModulesXcodeParams): string {
  const name = config.name;
  const safeName = escapeXMLCharacters(name);
  return IOSConfig.XcodeUtils.sanitizedName(safeName);
}

function getNativeTargetSynchronizedGroupsMap(pbxProject: XcodeProject) {
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

function prepareSynchronizedRootGroups(pbxProject: XcodeProject): {
  fsSynchronizedRootGroups: Map<string, UUID>;
} {
  const objects = pbxProject.hash.project.objects;
  const fsSynchronizedRootGroups = new Map<string, UUID>();
  if (objects.PBXFileSystemSynchronizedRootGroup) {
    for (const key of Object.keys(objects.PBXFileSystemSynchronizedRootGroup)) {
      if (key.endsWith('_comment')) {
        continue;
      }
      const groupObject = objects.PBXFileSystemSynchronizedRootGroup[key];
      fsSynchronizedRootGroups.set(groupObject.path, key);
    }
  } else {
    objects.PBXFileSystemSynchronizedRootGroup = {};
  }
  return { fsSynchronizedRootGroups };
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

  const nativeTargetSynchronizedGroups = getNativeTargetSynchronizedGroupsMap(pbxProject);
  const addWatchedDirectoryToTarget = (
    targetUUID: UUID,
    nativeTargetGroup: FileSystemSynchronizedGroup,
    dir: string,
    dirUUID: UUID
  ) => {
    if (!nativeTargetSynchronizedGroups.has(targetUUID)) {
      nativeTargetSynchronizedGroups.set(targetUUID, new Set<UUID>());
    }

    const targetSynchronizedGroups = nativeTargetSynchronizedGroups.get(targetUUID) as Set<UUID>;
    if (targetSynchronizedGroups.has(dirUUID)) {
      return;
    }

    if (!nativeTargetGroup.fileSystemSynchronizedGroups) {
      nativeTargetGroup.fileSystemSynchronizedGroups = [];
    }
    nativeTargetGroup.fileSystemSynchronizedGroups.push({ value: dirUUID, comment: dir });
    targetSynchronizedGroups.add(dirUUID);
  };

  const { fsSynchronizedRootGroups } = prepareSynchronizedRootGroups(pbxProject);
  const getOrCreateWatchedDirectoryUUID = (dir: string) => {
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

  const targetsToUpdate = pbxProject
    .getFirstProject()
    .firstProject.targets.filter((target: { value: UUID; comment: string }) => {
      const targetUuid = target.value;
      const targetName = pbxNativeTarget[targetUuid].name;
      if (!xcodeProjectTargets) {
        // If the xcodeProjectTargets are not provided, default to the main target
        return targetName === getMainTargetName(inlineModulesXcodeParams);
      }
      return xcodeProjectTargets.has(targetName);
    });

  for (const watchedDirectory of swiftWatchedDirectories) {
    const dirUUID = getOrCreateWatchedDirectoryUUID(watchedDirectory);

    for (const target of targetsToUpdate) {
      const nativeTargetGroup = objects.PBXNativeTarget[target.value];
      addWatchedDirectoryToTarget(target.value, nativeTargetGroup, watchedDirectory, dirUUID);
    }
  }

  await fs.promises.writeFile(pbxProject.filepath, pbxProject.writeSync());
}
