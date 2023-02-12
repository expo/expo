import { PBXNativeTarget, PBXTargetDependency, XCBuildConfiguration, XcodeProject } from 'xcode';

import { getApplicationTargetNameForSchemeAsync } from './BuildScheme';
import {
  getBuildConfigurationForListIdAndName,
  getPbxproj,
  isNotComment,
  NativeTargetSectionEntry,
} from './utils/Xcodeproj';
import { trimQuotes } from './utils/string';

export enum TargetType {
  APPLICATION = 'com.apple.product-type.application',
  EXTENSION = 'com.apple.product-type.app-extension',
  WATCH = 'com.apple.product-type.application.watchapp',
  APP_CLIP = 'com.apple.product-type.application.on-demand-install-capable',
  STICKER_PACK_EXTENSION = 'com.apple.product-type.app-extension.messages-sticker-pack',
  OTHER = 'other',
}

export interface Target {
  name: string;
  type: TargetType;
  dependencies?: Target[];
}

export function getXCBuildConfigurationFromPbxproj(
  project: XcodeProject,
  {
    targetName,
    buildConfiguration = 'Release',
  }: { targetName?: string; buildConfiguration?: string } = {}
): XCBuildConfiguration | null {
  const [, nativeTarget] = targetName
    ? findNativeTargetByName(project, targetName)
    : findFirstNativeTarget(project);
  const [, xcBuildConfiguration] = getBuildConfigurationForListIdAndName(project, {
    configurationListId: nativeTarget.buildConfigurationList,
    buildConfiguration,
  });
  return xcBuildConfiguration ?? null;
}

export async function findApplicationTargetWithDependenciesAsync(
  projectRoot: string,
  scheme: string
): Promise<Target> {
  const applicationTargetName = await getApplicationTargetNameForSchemeAsync(projectRoot, scheme);
  const project = getPbxproj(projectRoot);
  const [, applicationTarget] = findNativeTargetByName(project, applicationTargetName);
  const dependencies = getTargetDependencies(project, applicationTarget);
  return {
    name: trimQuotes(applicationTarget.name),
    type: TargetType.APPLICATION,
    dependencies,
  };
}

function getTargetDependencies(
  project: XcodeProject,
  parentTarget: PBXNativeTarget
): Target[] | undefined {
  if (!parentTarget.dependencies || parentTarget.dependencies.length === 0) {
    return undefined;
  }
  return parentTarget.dependencies.map(({ value }) => {
    const { target: targetId } = project.getPBXGroupByKeyAndType(
      value,
      'PBXTargetDependency'
    ) as PBXTargetDependency;

    const [, target] = findNativeTargetById(project, targetId);

    const type = isTargetOfType(target, TargetType.EXTENSION)
      ? TargetType.EXTENSION
      : TargetType.OTHER;
    return {
      name: trimQuotes(target.name),
      type,
      dependencies: getTargetDependencies(project, target),
    };
  });
}

export function isTargetOfType(target: PBXNativeTarget, targetType: TargetType): boolean {
  return trimQuotes(target.productType) === targetType;
}

export function getNativeTargets(project: XcodeProject): NativeTargetSectionEntry[] {
  const section = project.pbxNativeTargetSection();
  return Object.entries(section).filter(isNotComment);
}

export function findSignableTargets(project: XcodeProject): NativeTargetSectionEntry[] {
  const targets = getNativeTargets(project);

  const signableTargetTypes = [
    TargetType.APPLICATION,
    TargetType.APP_CLIP,
    TargetType.EXTENSION,
    TargetType.WATCH,
    TargetType.STICKER_PACK_EXTENSION,
  ];

  const applicationTargets = targets.filter(([, target]) => {
    for (const targetType of signableTargetTypes) {
      if (isTargetOfType(target, targetType)) {
        return true;
      }
    }
    return false;
  });
  if (applicationTargets.length === 0) {
    throw new Error(`Could not find any signable targets in project.pbxproj`);
  }
  return applicationTargets;
}

export function findFirstNativeTarget(project: XcodeProject): NativeTargetSectionEntry {
  const targets = getNativeTargets(project);
  const applicationTargets = targets.filter(([, target]) =>
    isTargetOfType(target, TargetType.APPLICATION)
  );
  if (applicationTargets.length === 0) {
    throw new Error(`Could not find any application target in project.pbxproj`);
  }
  return applicationTargets[0];
}

export function findNativeTargetByName(
  project: XcodeProject,
  targetName: string
): NativeTargetSectionEntry {
  const nativeTargets = getNativeTargets(project);
  const nativeTargetEntry = nativeTargets.find(([, i]) => trimQuotes(i.name) === targetName);
  if (!nativeTargetEntry) {
    throw new Error(`Could not find target '${targetName}' in project.pbxproj`);
  }
  return nativeTargetEntry;
}

function findNativeTargetById(project: XcodeProject, targetId: string): NativeTargetSectionEntry {
  const nativeTargets = getNativeTargets(project);
  const nativeTargetEntry = nativeTargets.find(([key]) => key === targetId);
  if (!nativeTargetEntry) {
    throw new Error(`Could not find target with id '${targetId}' in project.pbxproj`);
  }
  return nativeTargetEntry;
}
