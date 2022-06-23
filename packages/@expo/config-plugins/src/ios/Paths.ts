import { existsSync, readFileSync } from 'fs';
import { sync as globSync } from 'glob';
import * as path from 'path';

import { UnexpectedError } from '../utils/errors';
import { addWarningIOS } from '../utils/warnings';
import * as Entitlements from './Entitlements';

const ignoredPaths = ['**/@(Carthage|Pods|vendor|node_modules)/**'];

interface ProjectFile<L extends string = string> {
  path: string;
  language: L;
  contents: string;
}

type AppleLanguage = 'objc' | 'objcpp' | 'swift';

export type AppDelegateProjectFile = ProjectFile<AppleLanguage>;

export function getAppDelegateHeaderFilePath(projectRoot: string): string {
  const [using, ...extra] = globSync('ios/*/AppDelegate.h', {
    absolute: true,
    cwd: projectRoot,
    ignore: ignoredPaths,
  });

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

export function getAppDelegateFilePath(projectRoot: string): string {
  const [using, ...extra] = globSync('ios/*/AppDelegate.@(m|mm|swift)', {
    absolute: true,
    cwd: projectRoot,
    ignore: ignoredPaths,
  });

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

export function getAppDelegateObjcHeaderFilePath(projectRoot: string): string {
  const [using, ...extra] = globSync('ios/*/AppDelegate.h', {
    absolute: true,
    cwd: projectRoot,
    ignore: ignoredPaths,
  });

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

function getLanguage(filePath: string): AppleLanguage {
  const extension = path.extname(filePath);
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

export function getAppDelegate(projectRoot: string): AppDelegateProjectFile {
  const filePath = getAppDelegateFilePath(projectRoot);
  return getFileInfo(filePath);
}

export function getSourceRoot(projectRoot: string): string {
  const appDelegate = getAppDelegate(projectRoot);
  return path.dirname(appDelegate.path);
}

export function findSchemePaths(projectRoot: string): string[] {
  return globSync('ios/*.xcodeproj/xcshareddata/xcschemes/*.xcscheme', {
    absolute: true,
    cwd: projectRoot,
    ignore: ignoredPaths,
  });
}

export function findSchemeNames(projectRoot: string): string[] {
  const schemePaths = findSchemePaths(projectRoot);
  return schemePaths.map(schemePath => path.parse(schemePath).name);
}

export function getAllXcodeProjectPaths(projectRoot: string): string[] {
  const iosFolder = 'ios';
  const pbxprojPaths = globSync('ios/**/*.xcodeproj', { cwd: projectRoot, ignore: ignoredPaths })
    .filter(project => !/test|example|sample/i.test(project) || path.dirname(project) === iosFolder)
    // sort alphabetically to ensure this works the same across different devices (Fail in CI (linux) without this)
    .sort()
    .sort((a, b) => {
      const isAInIos = path.dirname(a) === iosFolder;
      const isBInIos = path.dirname(b) === iosFolder;
      // preserve previous sort order
      if ((isAInIos && isBInIos) || (!isAInIos && !isBInIos)) {
        return 0;
      }
      return isAInIos ? -1 : 1;
    });

  if (!pbxprojPaths.length) {
    throw new UnexpectedError(
      `Failed to locate the ios/*.xcodeproj files relative to path "${projectRoot}".`
    );
  }
  return pbxprojPaths.map(value => path.join(projectRoot, value));
}

/**
 * Get the pbxproj for the given path
 */
export function getXcodeProjectPath(projectRoot: string): string {
  const [using, ...extra] = getAllXcodeProjectPaths(projectRoot);

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

export function getAllPBXProjectPaths(projectRoot: string): string[] {
  const projectPaths = getAllXcodeProjectPaths(projectRoot);
  const paths = projectPaths
    .map(value => path.join(value, 'project.pbxproj'))
    .filter(value => existsSync(value));

  if (!paths.length) {
    throw new UnexpectedError(
      `Failed to locate the ios/*.xcodeproj/project.pbxproj files relative to path "${projectRoot}".`
    );
  }
  return paths;
}

export function getPBXProjectPath(projectRoot: string): string {
  const [using, ...extra] = getAllPBXProjectPaths(projectRoot);

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

export function getAllInfoPlistPaths(projectRoot: string): string[] {
  const paths = globSync('ios/*/Info.plist', {
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

export function getInfoPlistPath(projectRoot: string): string {
  const [using, ...extra] = getAllInfoPlistPaths(projectRoot);

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

export function getAllEntitlementsPaths(projectRoot: string): string[] {
  const paths = globSync('ios/*/*.entitlements', {
    absolute: true,
    cwd: projectRoot,
    ignore: ignoredPaths,
  });
  return paths;
}

/**
 * @deprecated: use Entitlements.getEntitlementsPath instead
 */
export function getEntitlementsPath(projectRoot: string): string | null {
  return Entitlements.getEntitlementsPath(projectRoot);
}

export function getSupportingPath(projectRoot: string): string {
  return path.resolve(projectRoot, 'ios', path.basename(getSourceRoot(projectRoot)), 'Supporting');
}

export function getExpoPlistPath(projectRoot: string): string {
  const supportingPath = getSupportingPath(projectRoot);
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
  const extraPaths = projectRoot ? extra.map(v => path.relative(projectRoot, v)) : extra;
  addWarningIOS(
    `paths-${tag}`,
    `Found multiple ${fileName} file paths, using "${usingPath}". Ignored paths: ${JSON.stringify(
      extraPaths
    )}`
  );
}
