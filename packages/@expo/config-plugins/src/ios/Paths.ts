import { existsSync, readFileSync } from 'fs';
import { globSync } from 'glob';
import * as path from 'path';

import type { ModPlatform } from '../Plugin.types';
import { UnexpectedError } from '../utils/errors';
import { withSortedGlobResult } from '../utils/glob';
import { addWarningIOS } from '../utils/warnings';
import * as Entitlements from './Entitlements';

const ignoredPaths = ['**/@(Carthage|Pods|vendor|node_modules)/**'];

/** Apple platforms that prebuild generates their own native project directory for. */
export type ApplePlatform = 'ios' | 'tvos';

/**
 * Builds a glob rooted at one Apple platform's native directory. Every helper below accepts an
 * optional platform: pass it to target that platform's project, and omit it to search all of them.
 * Omitting it is ambiguous once a project has both `ios/` and `tvos/`, so callers that know which
 * platform they are configuring — the base mods — always pass one.
 */
function platformGlob(pattern: string, platform?: ApplePlatform): string {
  return `${platform ?? '{ios,tvos}'}/${pattern}`;
}

/**
 * Narrows the mod compiler's platform to the Apple platform directory it writes to. The Apple mods
 * are registered under both `ios` and `tvos`, so any mod that resolves a path needs this.
 */
export function toApplePlatform(platform: ModPlatform): ApplePlatform {
  return platform === 'tvos' ? 'tvos' : 'ios';
}

interface ProjectFile<L extends string = string> {
  path: string;
  language: L;
  contents: string;
}

type AppleLanguage = 'objc' | 'objcpp' | 'swift' | 'rb';

export type PodfileProjectFile = ProjectFile<'rb'>;
export type AppDelegateProjectFile = ProjectFile<AppleLanguage>;

export function getAppDelegateHeaderFilePath(
  projectRoot: string,
  platform?: ApplePlatform
): string {
  const [using, ...extra] = withSortedGlobResult(
    globSync(platformGlob('*/AppDelegate.h', platform), {
      absolute: true,
      cwd: projectRoot,
      ignore: ignoredPaths,
    })
  );

  if (!using) {
    throw new UnexpectedError(
      `Could not locate a valid AppDelegate header at root: "${projectRoot}"`
    );
  }

  if (extra.length) {
    warnMultipleFiles({
      tag: 'app-delegate-header',
      fileName: 'AppDelegate',
      projectRoot,
      using,
      extra,
    });
  }

  return using;
}

export function getAppDelegateFilePath(projectRoot: string, platform?: ApplePlatform): string {
  const [using, ...extra] = withSortedGlobResult(
    globSync(platformGlob('*/AppDelegate.@(m|mm|swift)', platform), {
      absolute: true,
      cwd: projectRoot,
      ignore: ignoredPaths,
    })
  );

  if (!using) {
    throw new UnexpectedError(`Could not locate a valid AppDelegate at root: "${projectRoot}"`);
  }

  if (extra.length) {
    warnMultipleFiles({
      tag: 'app-delegate',
      fileName: 'AppDelegate',
      projectRoot,
      using,
      extra,
    });
  }

  return using;
}

export function getAppDelegateObjcHeaderFilePath(
  projectRoot: string,
  platform?: ApplePlatform
): string {
  const [using, ...extra] = withSortedGlobResult(
    globSync(platformGlob('*/AppDelegate.h', platform), {
      absolute: true,
      cwd: projectRoot,
      ignore: ignoredPaths,
    })
  );

  if (!using) {
    throw new UnexpectedError(`Could not locate a valid AppDelegate.h at root: "${projectRoot}"`);
  }

  if (extra.length) {
    warnMultipleFiles({
      tag: 'app-delegate-objc-header',
      fileName: 'AppDelegate.h',
      projectRoot,
      using,
      extra,
    });
  }

  return using;
}

export function getPodfilePath(projectRoot: string, platform?: ApplePlatform): string {
  const [using, ...extra] = withSortedGlobResult(
    globSync(platformGlob('Podfile', platform), {
      absolute: true,
      cwd: projectRoot,
      ignore: ignoredPaths,
    })
  );

  if (!using) {
    throw new UnexpectedError(`Could not locate a valid Podfile at root: "${projectRoot}"`);
  }

  if (extra.length) {
    warnMultipleFiles({
      tag: 'podfile',
      fileName: 'Podfile',
      projectRoot,
      using,
      extra,
    });
  }

  return using;
}

function getLanguage(filePath: string): AppleLanguage {
  const extension = path.extname(filePath);
  if (!extension && path.basename(filePath) === 'Podfile') {
    return 'rb';
  }
  switch (extension) {
    case '.mm':
      return 'objcpp';
    case '.m':
    case '.h':
      return 'objc';
    case '.swift':
      return 'swift';
    default:
      throw new UnexpectedError(`Unexpected iOS file extension: ${extension}`);
  }
}

export function getFileInfo(filePath: string) {
  return {
    path: path.normalize(filePath),
    contents: readFileSync(filePath, 'utf8'),
    language: getLanguage(filePath),
  };
}

export function getAppDelegate(
  projectRoot: string,
  platform?: ApplePlatform
): AppDelegateProjectFile {
  const filePath = getAppDelegateFilePath(projectRoot, platform);
  return getFileInfo(filePath);
}

export function getSourceRoot(projectRoot: string, platform?: ApplePlatform): string {
  const appDelegate = getAppDelegate(projectRoot, platform);
  return path.dirname(appDelegate.path);
}

export function findSchemePaths(projectRoot: string, platform?: ApplePlatform): string[] {
  return withSortedGlobResult(
    globSync(platformGlob('*.xcodeproj/xcshareddata/xcschemes/*.xcscheme', platform), {
      absolute: true,
      cwd: projectRoot,
      ignore: ignoredPaths,
    })
  );
}

export function findSchemeNames(projectRoot: string, platform?: ApplePlatform): string[] {
  const schemePaths = findSchemePaths(projectRoot, platform);
  return schemePaths.map((schemePath) => path.parse(schemePath).name);
}

export function getAllXcodeProjectPaths(projectRoot: string, platform?: ApplePlatform): string[] {
  const platformFolders = ['ios', 'tvos'];
  const pbxprojPaths = withSortedGlobResult(
    globSync(platformGlob('**/*.xcodeproj', platform), { cwd: projectRoot, ignore: ignoredPaths })
      // Drop leading `/` from glob results to mimic glob@<9 behavior
      .map((filePath) => filePath.replace(/^\//, ''))
      .filter(
        (project) =>
          !/test|example|sample/i.test(project) || platformFolders.includes(path.dirname(project))
      )
  ).sort((a, b) => {
    const isAInPlatform = platformFolders.includes(path.dirname(a));
    const isBInPlatform = platformFolders.includes(path.dirname(b));
    // preserve previous sort order
    if ((isAInPlatform && isBInPlatform) || (!isAInPlatform && !isBInPlatform)) {
      return 0;
    }
    return isAInPlatform ? -1 : 1;
  });

  if (!pbxprojPaths.length) {
    throw new UnexpectedError(
      `Failed to locate the {ios,tvos}/*.xcodeproj files relative to path "${projectRoot}".`
    );
  }
  return pbxprojPaths.map((value) => path.join(projectRoot, value));
}

/**
 * Get the pbxproj for the given path
 */
export function getXcodeProjectPath(projectRoot: string, platform?: ApplePlatform): string {
  const [using = '', ...extra] = getAllXcodeProjectPaths(projectRoot, platform);

  if (extra.length) {
    warnMultipleFiles({
      tag: 'xcodeproj',
      fileName: '*.xcodeproj',
      projectRoot,
      using,
      extra,
    });
  }

  return using;
}

export function getAllPBXProjectPaths(projectRoot: string, platform?: ApplePlatform): string[] {
  const projectPaths = getAllXcodeProjectPaths(projectRoot, platform);
  const paths = projectPaths
    .map((value) => path.join(value, 'project.pbxproj'))
    .filter((value) => existsSync(value));

  if (!paths.length) {
    throw new UnexpectedError(
      `Failed to locate the {ios,tvos}/*.xcodeproj/project.pbxproj files relative to path "${projectRoot}".`
    );
  }
  return paths;
}

export function getPBXProjectPath(projectRoot: string, platform?: ApplePlatform): string {
  const [using = '', ...extra] = getAllPBXProjectPaths(projectRoot, platform);

  if (extra.length) {
    warnMultipleFiles({
      tag: 'project-pbxproj',
      fileName: 'project.pbxproj',
      projectRoot,
      using,
      extra,
    });
  }

  return using;
}

export function getAllInfoPlistPaths(projectRoot: string, platform?: ApplePlatform): string[] {
  const paths = withSortedGlobResult(
    globSync(platformGlob('*/Info.plist', platform), {
      absolute: true,
      cwd: projectRoot,
      ignore: ignoredPaths,
    })
  ).sort(
    // longer name means more suffixes, we want the shortest possible one to be first.
    (a, b) => a.length - b.length
  );

  if (!paths.length) {
    throw new UnexpectedError(
      `Failed to locate Info.plist files relative to path "${projectRoot}".`
    );
  }
  return paths;
}

export function getInfoPlistPath(projectRoot: string, platform?: ApplePlatform): string {
  const [using = '', ...extra] = getAllInfoPlistPaths(projectRoot, platform);

  if (extra.length) {
    warnMultipleFiles({
      tag: 'info-plist',
      fileName: 'Info.plist',
      projectRoot,
      using,
      extra,
    });
  }

  return using;
}

export function getAllEntitlementsPaths(projectRoot: string, platform?: ApplePlatform): string[] {
  const paths = globSync(platformGlob('*/*.entitlements', platform), {
    absolute: true,
    cwd: projectRoot,
    ignore: ignoredPaths,
  });
  return paths;
}

/**
 * @deprecated: use Entitlements.getEntitlementsPath instead
 */
export function getEntitlementsPath(projectRoot: string, platform?: ApplePlatform): string | null {
  return Entitlements.getEntitlementsPath(projectRoot, { platform });
}

export function getSupportingPath(projectRoot: string, platform?: ApplePlatform): string {
  // Derive from the source root rather than hardcoding `ios/`, so a tvos project resolves to
  // `<projectRoot>/tvos/<name>/Supporting`.
  return path.resolve(getSourceRoot(projectRoot, platform), 'Supporting');
}

export function getExpoPlistPath(projectRoot: string, platform?: ApplePlatform): string {
  const supportingPath = getSupportingPath(projectRoot, platform);
  return path.join(supportingPath, 'Expo.plist');
}

function warnMultipleFiles({
  tag,
  fileName,
  projectRoot,
  using,
  extra,
}: {
  tag: string;
  fileName: string;
  projectRoot?: string;
  using: string;
  extra: string[];
}) {
  const usingPath = projectRoot ? path.relative(projectRoot, using) : using;
  const extraPaths = projectRoot ? extra.map((v) => path.relative(projectRoot, v)) : extra;
  addWarningIOS(
    `paths-${tag}`,
    `Found multiple ${fileName} file paths, using "${usingPath}". Ignored paths: ${JSON.stringify(
      extraPaths
    )}`
  );
}
