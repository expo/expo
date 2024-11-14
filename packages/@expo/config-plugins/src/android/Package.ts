import { ExpoConfig } from '@expo/config-types';
import Debug from 'debug';
import fs from 'fs';
import { globSync } from 'glob';
import path from 'path';

import { getAppBuildGradleFilePath, getProjectFilePath } from './Paths';
import { ConfigPlugin } from '../Plugin.types';
import { withAppBuildGradle } from '../plugins/android-plugins';
import { withDangerousMod } from '../plugins/withDangerousMod';
import { directoryExistsAsync } from '../utils/modules';
import { addWarningAndroid } from '../utils/warnings';

const debug = Debug('expo:config-plugins:android:package');

export const withPackageGradle: ConfigPlugin = (config) => {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      config.modResults.contents = setPackageInBuildGradle(config, config.modResults.contents);
    } else {
      addWarningAndroid(
        'android.package',
        `Cannot automatically configure app build.gradle if it's not groovy`
      );
    }
    return config;
  });
};

export const withPackageRefactor: ConfigPlugin = (config) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      await renamePackageOnDisk(config, config.modRequest.projectRoot);
      return config;
    },
  ]);
};

export function getPackage(config: Pick<ExpoConfig, 'android'>) {
  return config.android?.package ?? null;
}

function getPackageRoot(projectRoot: string, type: 'main' | 'debug') {
  return path.join(projectRoot, 'android', 'app', 'src', type, 'java');
}

function getCurrentPackageName(projectRoot: string, packageRoot: string) {
  const mainApplication = getProjectFilePath(projectRoot, 'MainApplication');
  const packagePath = path.dirname(mainApplication);
  const packagePathParts = path.relative(packageRoot, packagePath).split(path.sep).filter(Boolean);

  return packagePathParts.join('.');
}

function getCurrentPackageForProjectFile(
  projectRoot: string,
  packageRoot: string,
  fileName: string,
  type: string
) {
  const filePath = globSync(
    path.join(projectRoot, `android/app/src/${type}/java/**/${fileName}.@(java|kt)`)
  )[0];

  if (!filePath) {
    return null;
  }

  const packagePath = path.dirname(filePath);
  const packagePathParts = path.relative(packageRoot, packagePath).split(path.sep).filter(Boolean);

  return packagePathParts.join('.');
}

function getCurrentPackageNameForType(projectRoot: string, type: string): string | null {
  const packageRoot = getPackageRoot(projectRoot, type as any);

  if (type === 'main') {
    return getCurrentPackageName(projectRoot, packageRoot);
  }
  // debug, etc..
  return getCurrentPackageForProjectFile(projectRoot, packageRoot, '*', type);
}

// NOTE(brentvatne): this assumes that our MainApplication.java file is in the root of the package
// this makes sense for standard react-native projects but may not apply in customized projects, so if
// we want this to be runnable in any app we need to handle other possibilities
export async function renamePackageOnDisk(
  config: Pick<ExpoConfig, 'android'>,
  projectRoot: string
) {
  const newPackageName = getPackage(config);
  if (newPackageName === null) {
    return;
  }

  for (const type of ['debug', 'main', 'release']) {
    await renameJniOnDiskForType({ projectRoot, type, packageName: newPackageName });
    await renamePackageOnDiskForType({ projectRoot, type, packageName: newPackageName });
  }
}

export async function renameJniOnDiskForType({
  projectRoot,
  type,
  packageName,
}: {
  projectRoot: string;
  type: string;
  packageName: string;
}) {
  if (!packageName) {
    return;
  }

  const currentPackageName = getCurrentPackageNameForType(projectRoot, type);
  if (!currentPackageName || !packageName || currentPackageName === packageName) {
    return;
  }

  const jniRoot = path.join(projectRoot, 'android', 'app', 'src', type, 'jni');
  const filesToUpdate = [...globSync('**/*', { cwd: jniRoot, absolute: true })];
  // Replace all occurrences of the path in the project
  filesToUpdate.forEach((filepath: string) => {
    try {
      if (fs.lstatSync(filepath).isFile() && ['.h', '.cpp'].includes(path.extname(filepath))) {
        let contents = fs.readFileSync(filepath).toString();
        contents = contents.replace(
          new RegExp(transformJavaClassDescriptor(currentPackageName).replace(/\//g, '\\/'), 'g'),
          transformJavaClassDescriptor(packageName)
        );
        fs.writeFileSync(filepath, contents);
      }
    } catch {
      debug(`Error updating "${filepath}" for type "${type}"`);
    }
  });
}

export async function renamePackageOnDiskForType({
  projectRoot,
  type,
  packageName,
}: {
  projectRoot: string;
  type: string;
  packageName: string;
}) {
  if (!packageName) {
    return;
  }

  const currentPackageName = getCurrentPackageNameForType(projectRoot, type);
  debug(`Found package "${currentPackageName}" for type "${type}"`);
  if (!currentPackageName || currentPackageName === packageName) {
    return;
  }
  debug(`Refactor "${currentPackageName}" to "${packageName}" for type "${type}"`);
  const packageRoot = getPackageRoot(projectRoot, type as any);
  // Set up our paths
  if (!(await directoryExistsAsync(packageRoot))) {
    debug(`- skipping refactor of missing directory: ${packageRoot}`);
    return;
  }

  const currentPackagePath = path.join(packageRoot, ...currentPackageName.split('.'));
  const newPackagePath = path.join(packageRoot, ...packageName.split('.'));

  // Create the new directory
  fs.mkdirSync(newPackagePath, { recursive: true });

  // Move everything from the old directory over
  globSync('**/*', { cwd: currentPackagePath }).forEach((relativePath) => {
    const filepath = path.join(currentPackagePath, relativePath);
    if (fs.lstatSync(filepath).isFile()) {
      moveFileSync(filepath, path.join(newPackagePath, relativePath));
    } else {
      fs.mkdirSync(filepath, { recursive: true });
    }
  });

  // Remove the old directory recursively from com/old/package to com/old and com,
  // as long as the directories are empty
  const oldPathParts = currentPackageName.split('.');
  while (oldPathParts.length) {
    const pathToCheck = path.join(packageRoot, ...oldPathParts);
    try {
      const files = fs.readdirSync(pathToCheck);
      if (files.length === 0) {
        fs.rmdirSync(pathToCheck);
      }
    } finally {
      oldPathParts.pop();
    }
  }

  const filesToUpdate = [...globSync('**/*', { cwd: newPackagePath, absolute: true })];
  // Only update the BUCK file to match the main package name
  if (type === 'main') {
    // NOTE(EvanBacon): We dropped this file in SDK 48 but other templates may still use it.
    filesToUpdate.push(path.join(projectRoot, 'android', 'app', 'BUCK'));
  }

  const kotlinSanitizedPackageName = kotlinSanitized(packageName);
  // Replace all occurrences of the path in the project
  filesToUpdate.forEach((filepath: string) => {
    try {
      if (fs.lstatSync(filepath).isFile()) {
        let contents = fs.readFileSync(filepath).toString();
        if (path.extname(filepath) === '.kt') {
          contents = replacePackageName(contents, currentPackageName, kotlinSanitizedPackageName);
        } else {
          contents = replacePackageName(contents, currentPackageName, packageName);
        }
        if (['.h', '.cpp'].includes(path.extname(filepath))) {
          contents = contents.replace(
            new RegExp(transformJavaClassDescriptor(currentPackageName).replace(/\//g, '\\'), 'g'),
            transformJavaClassDescriptor(packageName)
          );
        }
        fs.writeFileSync(filepath, contents);
      }
    } catch {
      debug(`Error updating "${filepath}" for type "${type}"`);
    }
  });
}

function moveFileSync(src: string, dest: string) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.renameSync(src, dest);
}

export function setPackageInBuildGradle(config: Pick<ExpoConfig, 'android'>, buildGradle: string) {
  const packageName = getPackage(config);
  if (packageName === null) {
    return buildGradle;
  }

  const pattern = new RegExp(`(applicationId|namespace) ['"].*['"]`, 'g');
  return buildGradle.replace(pattern, `$1 '${packageName}'`);
}

export async function getApplicationIdAsync(projectRoot: string): Promise<string | null> {
  const buildGradlePath = getAppBuildGradleFilePath(projectRoot);
  if (!fs.existsSync(buildGradlePath)) {
    return null;
  }
  const buildGradle = await fs.promises.readFile(buildGradlePath, 'utf8');
  const matchResult = buildGradle.match(/applicationId ['"](.*)['"]/);
  // TODO add fallback for legacy cases to read from AndroidManifest.xml
  return matchResult?.[1] ?? null;
}

/**
 * Replace the package name with the new package name, in the given source.
 * This has to be limited to avoid accidentally replacing imports when the old package name overlaps.
 */
function replacePackageName(content: string, oldName: string, newName: string) {
  const oldNameEscaped = oldName.replace(/\./g, '\\.');

  return (
    content
      // Replace any quoted instances "com.old" -> "com.new"
      .replace(new RegExp(`"${oldNameEscaped}"`, 'g'), `"${newName}"`)
      // Replace special non-quoted instances, only when prefixed by package or namespace
      .replace(new RegExp(`(package|namespace)(\\s+)${oldNameEscaped}`, 'g'), `$1$2${newName}`)
      // Replace special import instances, without overlapping with other imports (trailing `.` to close it off)
      .replace(new RegExp(`(import\\s+)${oldNameEscaped}\\.`, 'g'), `$1${newName}.`)
  );
}

/**
 * Transform a java package name to java class descriptor,
 * e.g. `com.helloworld` -> `Lcom/helloworld`.
 */
function transformJavaClassDescriptor(packageName: string) {
  return `L${packageName.replace(/\./g, '/')}`;
}

/**
 * Make a package name safe to use in a kotlin file,
 * e.g. is.pvin.hello -> `is`.pvin.hello
 */
export function kotlinSanitized(packageName: string) {
  const stringsToWrap = ['is', 'in', 'as', 'fun'];

  const parts = packageName.split('.');
  const cleanParts = parts.map((part) => (stringsToWrap.includes(part) ? '`' + part + '`' : part));

  const cleanName = cleanParts.join('.');
  return cleanName;
}
