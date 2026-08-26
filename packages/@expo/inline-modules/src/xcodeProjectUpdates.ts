import { IOSConfig, type XcodeProject } from '@expo/config-plugins';
import fs from 'fs';
import path from 'path';

export interface InlineModulesXcodeParams {
  watchedDirectories: string[];
  /**
   * List of targets to which inline modules files are added. If undefined defaults to the main target only.
   */
  xcodeProjectTargets?: string[];
  /**
   * The app name from the Expo config. Used as the tiebreak fallback when the
   * project has several application targets and no source folder is on disk.
   */
  appName?: string;
}

type UUID = string;

/**
 * A `PBXNativeTarget` object as stored in the pbxproj. The `fileSystemSynchronizedGroups`
 * field isn't part of the upstream `PBXNativeTarget` type declaration, so we model it here.
 */
type NativeTarget = NonNullable<
  XcodeProject['hash']['project']['objects']['PBXNativeTarget'][string]
> & {
  fileSystemSynchronizedGroups?: { value: string; comment?: string }[];
};

const APPLICATION_PRODUCT_TYPE = 'com.apple.product-type.application';

const unquote = (value: string) => value.replace(/^"(.*)"$/, '$1');

// The pbxproj is the source of truth for the main target: names derived from the
// app config can drift from it (older sanitizer output, or a manual rename).
// Iterated by hand because `pbxProject.getTarget` crashes on aggregate and legacy
// targets, which are absent from the PBXNativeTarget section.
// Keep in sync with `resolveMainTargetName` in `@expo/prebuild-config`.
function getMainApplicationTargetUuid(
  pbxProject: XcodeProject,
  projectRoot: string,
  appName: string | undefined
): UUID {
  // The section is absent when the project holds only aggregate/legacy targets.
  const nativeTargets = pbxProject.hash.project.objects.PBXNativeTarget ?? {};
  const applicationTargetUuids = pbxProject
    .getFirstProject()
    .firstProject.targets.map((target: { value: UUID }) => target.value)
    .filter((uuid: UUID) => {
      const productType = (nativeTargets[uuid] as NativeTarget | undefined)?.productType;
      return typeof productType === 'string' && unquote(productType) === APPLICATION_PRODUCT_TYPE;
    });

  if (applicationTargetUuids.length === 0) {
    throw new Error(
      'Inline modules could not find an application target (product type "com.apple.product-type.application") in your iOS Xcode project. ' +
        'Inline module directories are attached to the main application target by default. ' +
        'Check that the project builds in Xcode, or list the targets explicitly in `expo.experiments.inlineModules.xcodeProjectTargets` in your app config.'
    );
  }
  if (applicationTargetUuids.length > 1) {
    // A paired watchOS app also uses the application product type; prefer the
    // target named after the on-disk project.
    const targetName = (uuid: UUID) => unquote(String((nativeTargets[uuid] as NativeTarget).name));
    let projectName: string | null;
    try {
      projectName = IOSConfig.XcodeUtils.getProjectName(projectRoot);
    } catch {
      // No source folder on disk; fall back to the config-derived name, the
      // same tiebreak `resolveMainTargetName` in @expo/prebuild-config uses.
      projectName = appName ? IOSConfig.XcodeUtils.sanitizedName(appName) : null;
    }
    const named = applicationTargetUuids.find((uuid: UUID) => targetName(uuid) === projectName);
    if (named) {
      return named;
    }
    console.warn(
      `Inline modules found multiple application targets (${applicationTargetUuids
        .map(targetName)
        .join(', ')}) and none matches the project name. ` +
        `Using the first one, "${targetName(applicationTargetUuids[0]!)}". ` +
        'Set `expo.experiments.inlineModules.xcodeProjectTargets` in your app config to pick the targets explicitly.'
    );
  }
  return applicationTargetUuids[0]!;
}

function getNativeTargetSynchronizedGroupsMap(pbxProject: XcodeProject) {
  const objects = pbxProject.hash.project.objects;
  const nativeTargetSynchronizedGroups = new Map<UUID, Set<UUID>>();

  for (const target of pbxProject.getFirstProject().firstProject.targets) {
    const nativeTargetGroup = (objects.PBXNativeTarget ?? {})[target.value] as
      | NativeTarget
      | undefined;
    const synchronizedGroups = new Set<UUID>();

    if (nativeTargetGroup?.fileSystemSynchronizedGroups) {
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
      const groupObject = objects.PBXFileSystemSynchronizedRootGroup[key]!;
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
  const pbxNativeTarget = pbxProject.hash.project.objects.PBXNativeTarget ?? {};

  const nativeTargetSynchronizedGroups = getNativeTargetSynchronizedGroupsMap(pbxProject);
  const addWatchedDirectoryToTarget = (
    targetUUID: UUID,
    nativeTargetGroup: NativeTarget,
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
  const getOrCreateWatchedDirectoryUUID = (dir: string): UUID => {
    const dirRelativeToIos = path.join(projectRootRelativeToIos, dir);
    const existingUUID = fsSynchronizedRootGroups.get(dirRelativeToIos);
    if (existingUUID !== undefined) {
      return existingUUID;
    }

    const newUUID = pbxProject.generateUuid();
    objects.PBXGroup[mainGroupUUID]!.children.push({
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

  // If the xcodeProjectTargets are not provided, default to the main target
  const mainTargetUuid = xcodeProjectTargets
    ? null
    : getMainApplicationTargetUuid(pbxProject, projectRoot, inlineModulesXcodeParams.appName);
  const targetsToUpdate = pbxProject
    .getFirstProject()
    .firstProject.targets.filter((target: { value: UUID; comment: string }) => {
      const targetUuid = target.value;
      const targetName = pbxNativeTarget[targetUuid]?.name;
      if (targetName === undefined) {
        return false;
      }
      if (!xcodeProjectTargets) {
        return targetUuid === mainTargetUuid;
      }
      // pbxproj quotes names containing spaces; the user config value is unquoted.
      return xcodeProjectTargets.has(unquote(targetName));
    });

  for (const watchedDirectory of swiftWatchedDirectories) {
    const dirUUID = getOrCreateWatchedDirectoryUUID(watchedDirectory);

    for (const target of targetsToUpdate) {
      const nativeTargetGroup = objects.PBXNativeTarget[target.value] as NativeTarget;
      addWatchedDirectoryToTarget(target.value, nativeTargetGroup, watchedDirectory, dirUUID);
    }
  }

  await fs.promises.writeFile(pbxProject.filepath, pbxProject.writeSync());
}
