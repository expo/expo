import { existsSync, readFileSync } from 'fs';
import { globSync } from 'glob';
import * as path from 'path';

import * as Entitlements from './Entitlements';
import { UnexpectedError } from '../utils/errors';
import { withSortedGlobResult } from '../utils/glob';
import { addWarningForPlatform } from '../utils/warnings';

const ignoredPaths = ['**/@(Carthage|Pods|vendor|node_modules)/**'];

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
  applePlatform: 'ios' | 'macos'
): string {
  const applePlatformDir = applePlatform;
  const [using, ...extra] = withSortedGlobResult(
    globSync(`${applePlatformDir}/*/AppDelegate.h`, {
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
      applePlatform,
      tag: 'app-delegate-header',
      fileName: 'AppDelegate',
      projectRoot,
      using,
      extra,
    });
  }

  return using;
}

export function getAppDelegateFilePath(
  projectRoot: string,
  applePlatform: 'ios' | 'macos'
): string {
  const applePlatformDir = applePlatform;
  const [using, ...extra] = withSortedGlobResult(
    globSync(`${applePlatformDir}/*/AppDelegate.@(m|mm|swift)`, {
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
      applePlatform,
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
  applePlatform: 'ios' | 'macos'
): string {
  const applePlatformDir = applePlatform;
  const [using, ...extra] = withSortedGlobResult(
    globSync(`${applePlatformDir}/*/AppDelegate.h`, {
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
      applePlatform,
      tag: 'app-delegate-objc-header',
      fileName: 'AppDelegate.h',
      projectRoot,
      using,
      extra,
    });
  }

  return using;
}

export function getPodfilePath(projectRoot: string, applePlatform: 'ios' | 'macos'): string {
  const applePlatformDir = applePlatform;
  const [using, ...extra] = withSortedGlobResult(
    globSync(`${applePlatformDir}/Podfile`, {
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
      applePlatform,
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
      throw new UnexpectedError(`Unexpected Apple file extension: ${extension}`);
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
  applePlatform: 'ios' | 'macos'
): AppDelegateProjectFile {
  const filePath = getAppDelegateFilePath(projectRoot, applePlatform);
  return getFileInfo(filePath);
}

export function getSourceRoot(projectRoot: string, applePlatform: 'ios' | 'macos'): string {
  const appDelegate = getAppDelegate(projectRoot, applePlatform);
  return path.dirname(appDelegate.path);
}

export function findSchemePaths(projectRoot: string, applePlatform: 'ios' | 'macos'): string[] {
  const applePlatformDir = applePlatform;
  return withSortedGlobResult(
    globSync(`${applePlatformDir}/*.xcodeproj/xcshareddata/xcschemes/*.xcscheme`, {
      absolute: true,
      cwd: projectRoot,
      ignore: ignoredPaths,
    })
  );
}

export function findSchemeNames(projectRoot: string, applePlatform: 'ios' | 'macos'): string[] {
  const schemePaths = findSchemePaths(projectRoot, applePlatform);
  return schemePaths.map((schemePath) => path.parse(schemePath).name);
}

export function getAllXcodeProjectPaths(
  projectRoot: string,
  applePlatform: 'ios' | 'macos'
): string[] {
  const applePlatformDir = applePlatform;
  const pbxprojPaths = withSortedGlobResult(
    globSync(`${applePlatformDir}/**/*.xcodeproj`, { cwd: projectRoot, ignore: ignoredPaths })
      // Drop leading `/` from glob results to mimick glob@<9 behavior
      .map((filePath) => filePath.replace(/^\//, ''))
      .filter(
        (project) =>
          !/test|example|sample/i.test(project) || path.dirname(project) === applePlatformDir
      )
  ).sort((a, b) => {
    const isAInApplePlatformDir = path.dirname(a) === applePlatformDir;
    const isBInApplePlatformDir = path.dirname(b) === applePlatformDir;
    // preserve previous sort order
    if (
      (isAInApplePlatformDir && isBInApplePlatformDir) ||
      (!isAInApplePlatformDir && !isBInApplePlatformDir)
    ) {
      return 0;
    }
    return isAInApplePlatformDir ? -1 : 1;
  });

  if (!pbxprojPaths.length) {
    throw new UnexpectedError(
      `Failed to locate the ${applePlatformDir}/*.xcodeproj files relative to path "${projectRoot}".`
    );
  }
  return pbxprojPaths.map((value) => path.join(projectRoot, value));
}

/**
 * Get the pbxproj for the given path
 */
export function getXcodeProjectPath(projectRoot: string, applePlatform: 'ios' | 'macos'): string {
  const [using, ...extra] = getAllXcodeProjectPaths(projectRoot, applePlatform);

  if (extra.length) {
    warnMultipleFiles({
      applePlatform,
      tag: 'xcodeproj',
      fileName: '*.xcodeproj',
      projectRoot,
      using,
      extra,
    });
  }

  return using;
}

export function getAllPBXProjectPaths(
  projectRoot: string,
  applePlatform: 'ios' | 'macos'
): string[] {
  const applePlatformDir = applePlatform;
  const projectPaths = getAllXcodeProjectPaths(projectRoot, applePlatform);
  const paths = projectPaths
    .map((value) => path.join(value, 'project.pbxproj'))
    .filter((value) => existsSync(value));

  if (!paths.length) {
    throw new UnexpectedError(
      `Failed to locate the ${applePlatformDir}/*.xcodeproj/project.pbxproj files relative to path "${projectRoot}".`
    );
  }
  return paths;
}

export function getPBXProjectPath(projectRoot: string, applePlatform: 'ios' | 'macos'): string {
  const [using, ...extra] = getAllPBXProjectPaths(projectRoot, applePlatform);

  if (extra.length) {
    warnMultipleFiles({
      applePlatform,
      tag: 'project-pbxproj',
      fileName: 'project.pbxproj',
      projectRoot,
      using,
      extra,
    });
  }

  return using;
}

export function getAllInfoPlistPaths(
  projectRoot: string,
  applePlatform: 'ios' | 'macos'
): string[] {
  const applePlatformDir = applePlatform;
  const paths = globSync(`${applePlatformDir}/*/Info.plist`, {
    absolute: true,
    cwd: projectRoot,
    ignore: ignoredPaths,
  }).sort(
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

export function getInfoPlistPath(projectRoot: string, applePlatform: 'ios' | 'macos'): string {
  const [using, ...extra] = getAllInfoPlistPaths(projectRoot, applePlatform);

  if (extra.length) {
    warnMultipleFiles({
      applePlatform,
      tag: 'info-plist',
      fileName: 'Info.plist',
      projectRoot,
      using,
      extra,
    });
  }

  return using;
}

export function getAllEntitlementsPaths(
  projectRoot: string,
  applePlatform: 'ios' | 'macos'
): string[] {
  const applePlatformDir = applePlatform;
  const paths = globSync(`${applePlatformDir}/*/*.entitlements`, {
    absolute: true,
    cwd: projectRoot,
    ignore: ignoredPaths,
  });
  return paths;
}

/**
 * @deprecated: use Entitlements.getEntitlementsPath instead
 */
export function getEntitlementsPath(
  projectRoot: string,
  applePlatform: 'ios' | 'macos'
): string | null {
  return Entitlements.getEntitlementsPath(projectRoot, applePlatform);
}

export function getSupportingPath(projectRoot: string, applePlatform: 'ios' | 'macos'): string {
  const applePlatformDir = applePlatform;
  return path.resolve(
    projectRoot,
    applePlatformDir,
    path.basename(getSourceRoot(projectRoot, applePlatform)),
    'Supporting'
  );
}

export function getExpoPlistPath(projectRoot: string, applePlatform: 'ios' | 'macos'): string {
  const supportingPath = getSupportingPath(projectRoot, applePlatform);
  return path.join(supportingPath, 'Expo.plist');
}

function warnMultipleFiles({
  applePlatform,
  tag,
  fileName,
  projectRoot,
  using,
  extra,
}: {
  applePlatform: 'ios' | 'macos';
  tag: string;
  fileName: string;
  projectRoot?: string;
  using: string;
  extra: string[];
}) {
  const usingPath = projectRoot ? path.relative(projectRoot, using) : using;
  const extraPaths = projectRoot ? extra.map((v) => path.relative(projectRoot, v)) : extra;
  addWarningForPlatform(
    applePlatform,
    `paths-${tag}`,
    `Found multiple ${fileName} file paths, using "${usingPath}". Ignored paths: ${JSON.stringify(
      extraPaths
    )}`
  );
}
