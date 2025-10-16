import { getConfig } from '@expo/config';
import { getPbxproj } from '@expo/config-plugins/build/ios/utils/Xcodeproj';
import Server from '@expo/metro/metro/Server';
import type MetroServer from '@expo/metro/metro/Server';
import fs from 'fs';
import path from 'path';

import { Event, EventsQueue } from './generation.types';
import { ensureDotExpoProjectDirectoryInitialized } from '../start/project/dotExpo';

export interface ModuleGenerationArguments {
  projectRoot: string;
  metro: Server | null;
}

function findUpTSConfig(cwd: string): string | null {
  const tsconfigPath = path.resolve(cwd, './tsconfig.json');
  if (fs.existsSync(tsconfigPath)) {
    return path.dirname(tsconfigPath);
  }

  const parent = path.dirname(cwd);
  if (parent === cwd) return null;

  return findUpTSConfig(parent);
}

function findUpTSProjectRootOrThrow(dir: string): string {
  const tsProjectRoot = findUpTSConfig(dir);
  if (!tsProjectRoot) {
    throw new Error('Local modules watched dir needs to be inside a TS project with tsconfig.json');
  }
  return tsProjectRoot;
}

const nativeExtensions = ['.kt', '.swift'];

function isValidLocalModuleFileName(fileName: string): boolean {
  let numberOfDots = 0;
  for (const character of fileName) {
    if (character === '.') {
      numberOfDots += 1;
    }
  }

  let hasNativeExtension: boolean = false;
  for (const extension of nativeExtensions) {
    if (fileName.endsWith(extension)) {
      hasNativeExtension = true;
      break;
    }
  }

  return hasNativeExtension && numberOfDots === 1;
}

function getMirrorDirectories(projectRoot: string): {
  localModulesModulesPath: string;
  localModulesTypesPath: string;
} {
  const dotExpoDir = ensureDotExpoProjectDirectoryInitialized(projectRoot);
  const localModulesPath = path.resolve(dotExpoDir, './localModules/');

  const localModulesModulesPath = path.resolve(localModulesPath, 'modules');
  const localModulesTypesPath = path.resolve(localModulesPath, 'types');

  return {
    localModulesModulesPath,
    localModulesTypesPath,
  };
}

function createFreshMirrorDirectories(projectRoot: string): void {
  const { localModulesModulesPath, localModulesTypesPath } = getMirrorDirectories(projectRoot);

  if (fs.existsSync(localModulesModulesPath)) {
    fs.rmSync(localModulesModulesPath, { recursive: true, force: true });
  }
  if (fs.existsSync(localModulesTypesPath)) {
    fs.rmSync(localModulesTypesPath, { recursive: true, force: true });
  }
  fs.mkdirSync(localModulesModulesPath, { recursive: true });
  fs.mkdirSync(localModulesTypesPath, { recursive: true });
}

function trimExtension(fileName: string): string {
  return fileName.substring(0, fileName.lastIndexOf('.'));
}

function typesAndLocalModulePathsForFile(
  projectRoot: string,
  watchedDirRootAbolutePath: string,
  absoluteFilePath: string
): {
  moduleTypesFilePath: string;
  viewTypesFilePath: string;
  viewExportPath: string;
  moduleExportPath: string;
  moduleName: string;
} {
  const { localModulesModulesPath, localModulesTypesPath } = getMirrorDirectories(projectRoot);
  const fileName = path.basename(absoluteFilePath);
  const moduleName = trimExtension(fileName);

  const watchedDirTSProjectRoot = findUpTSProjectRootOrThrow(watchedDirRootAbolutePath);
  const filePathRelativeToTSProjectRoot = path.relative(watchedDirTSProjectRoot, absoluteFilePath);
  const filePathRelativeToTSProjectRootWithoutExtension = trimExtension(
    filePathRelativeToTSProjectRoot
  );

  const moduleTypesFilePath = path.resolve(
    localModulesTypesPath,
    filePathRelativeToTSProjectRootWithoutExtension + '.module.d.ts'
  );
  const viewTypesFilePath = path.resolve(
    localModulesTypesPath,
    filePathRelativeToTSProjectRootWithoutExtension + '.view.d.ts'
  );
  const moduleExportPath = path.resolve(
    localModulesModulesPath,
    filePathRelativeToTSProjectRootWithoutExtension + '.module.js'
  );
  const viewExportPath = path.resolve(
    localModulesModulesPath,
    filePathRelativeToTSProjectRootWithoutExtension + '.view.js'
  );
  return {
    moduleTypesFilePath,
    viewTypesFilePath,
    viewExportPath,
    moduleExportPath,
    moduleName,
  };
}

function fileWatchedWithAnyNativeExtension(
  absoluteFilePath: string,
  filesWatched: Set<string>
): boolean {
  const fileWithoutExtension = trimExtension(absoluteFilePath);
  for (const extension of nativeExtensions) {
    const fileToCheck = `${fileWithoutExtension}${extension}`;
    if (filesWatched.has(fileToCheck)) {
      return true;
    }
  }
  return false;
}

export function updateXCodeProject(projectRoot: string): void {
  const pbxProject = getPbxproj(projectRoot);
  const mainGroupUUID = pbxProject.getFirstProject().firstProject.mainGroup;
  const mainTargetUUID = pbxProject.getFirstProject().firstProject.targets[0].value;
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

  const swiftWatchedDirectories = getConfig(projectRoot).exp.localModules?.watchedDirs ?? [];
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

    //@ts-ignore
    objects.PBXFileSystemSynchronizedRootGroup[newUUID + '_comment'] = dir;

    const nativeTargetGroup = objects.PBXNativeTarget[mainTargetUUID];
    if (!nativeTargetGroup.fileSystemSynchronizedGroups) {
      nativeTargetGroup.fileSystemSynchronizedGroups = [];
    }
    nativeTargetGroup.fileSystemSynchronizedGroups.push({ value: newUUID, comment: dir });
  }

  fs.writeFileSync(pbxProject.filepath, pbxProject.writeSync());
}

function getWatchedDirAncestorAbsolutePath(
  projectRoot: string,
  filePathAbsolute: string
): string | null {
  const watchedDirs = getConfig(projectRoot).exp.localModules?.watchedDirs ?? [];
  const realRoot = path.resolve(projectRoot);
  for (const dir of watchedDirs) {
    const dirPathAbsolute = path.resolve(realRoot, dir);
    if (filePathAbsolute.startsWith(dirPathAbsolute)) {
      return dirPathAbsolute;
    }
  }
  return null;
}

function onSourceFileCreated(
  projectRoot: string,
  watchedDirRootAbolutePath: string,
  absoluteFilePath: string,
  filesWatched?: Set<string>
): void {
  const { moduleTypesFilePath, viewTypesFilePath, viewExportPath, moduleExportPath, moduleName } =
    typesAndLocalModulePathsForFile(projectRoot, watchedDirRootAbolutePath, absoluteFilePath);

  if (filesWatched && fileWatchedWithAnyNativeExtension(absoluteFilePath, filesWatched)) {
    filesWatched.add(absoluteFilePath);
    return;
  }
  if (filesWatched) {
    filesWatched.add(absoluteFilePath);
  }

  fs.mkdirSync(path.dirname(moduleExportPath), { recursive: true });
  fs.mkdirSync(path.dirname(moduleTypesFilePath), { recursive: true });

  fs.writeFileSync(
    viewExportPath,
    `import { requireNativeView } from 'expo';
export default requireNativeView("${moduleName}");`
  );

  fs.writeFileSync(
    moduleExportPath,
    `import { requireNativeModule } from 'expo';
export default requireNativeModule("${moduleName}");`
  );

  fs.writeFileSync(
    viewTypesFilePath,
    `import React from "react"
const _default: React.JSX.ElementType
export default _default`
  );
  fs.writeFileSync(moduleTypesFilePath, 'const _default: any\nexport default _default');
}

async function generateMirrorDirectories(
  projectRoot: string,
  filesWatched?: Set<string>
): Promise<void> {
  createFreshMirrorDirectories(projectRoot);

  const generateExportsAndTypesForDirectory = async (
    absoluteDirPath: string,
    watchedDirRootAbolutePath: string
  ) => {
    for (const glob of excludePathsGlobs(projectRoot)) {
      if (path.matchesGlob(absoluteDirPath, glob)) {
        return;
      }
    }

    const dir = fs.opendirSync(absoluteDirPath);
    for await (const dirent of dir) {
      const absoluteDirentPath = path.resolve(absoluteDirPath, dirent.name);
      if (
        dirent.isFile() &&
        isValidLocalModuleFileName(dirent.name) &&
        absoluteDirentPath.startsWith(watchedDirRootAbolutePath)
      ) {
        onSourceFileCreated(
          projectRoot,
          watchedDirRootAbolutePath,
          absoluteDirentPath,
          filesWatched
        );
      } else if (dirent.isDirectory()) {
        await generateExportsAndTypesForDirectory(absoluteDirentPath, watchedDirRootAbolutePath);
      }
    }
  };

  const watchedDirs = getConfig(projectRoot).exp.localModules?.watchedDirs ?? [];
  for (const watchedDir of watchedDirs) {
    await generateExportsAndTypesForDirectory(
      path.resolve(projectRoot, watchedDir),
      fs.realpathSync(watchedDir)
    );
  }
}

function excludePathsGlobs(projectRoot: string): string[] {
  return [
    path.resolve(projectRoot, '.expo'),
    path.resolve(projectRoot, '.expo', './**/*'),
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(projectRoot, 'node_modules', './**/*'),
    path.resolve(projectRoot, 'localModules'),
    path.resolve(projectRoot, 'localModules', './**/*'),
    path.resolve(projectRoot, 'android'),
    path.resolve(projectRoot, 'android', './**/*'),
    path.resolve(projectRoot, 'ios'),
    path.resolve(projectRoot, 'ios', './**/*'),
    path.resolve(projectRoot, 'modules'),
    path.resolve(projectRoot, 'modules', './**/*'),
  ];
}

export async function startModuleGenerationAsync({
  projectRoot,
  metro,
}: ModuleGenerationArguments): Promise<void> {
  const dotExpoDir = ensureDotExpoProjectDirectoryInitialized(projectRoot);
  const filesWatched = new Set<string>();

  const isFileExcluded = (absolutePath: string) => {
    for (const glob of excludePathsGlobs(projectRoot)) {
      if (path.matchesGlob(absolutePath, glob)) {
        return true;
      }
    }
    return false;
  };

  createFreshMirrorDirectories(projectRoot);

  const removeFileAndEmptyDirectories = (absoluteFilePath: string) => {
    fs.rmSync(absoluteFilePath);
    let dirNow: string = path.dirname(absoluteFilePath);
    while (fs.readdirSync(dirNow).length === 0 && dirNow !== dotExpoDir) {
      fs.rmdirSync(dirNow);
      dirNow = path.dirname(dirNow);
    }
  };

  const onSourceFileRemoved = (absoluteFilePath: string, watchedDirRootAbolutePath: string) => {
    const { moduleTypesFilePath, moduleExportPath, viewExportPath, viewTypesFilePath } =
      typesAndLocalModulePathsForFile(projectRoot, watchedDirRootAbolutePath, absoluteFilePath);

    filesWatched.delete(absoluteFilePath);
    if (!fileWatchedWithAnyNativeExtension(absoluteFilePath, filesWatched)) {
      removeFileAndEmptyDirectories(moduleTypesFilePath);
      removeFileAndEmptyDirectories(moduleExportPath);
      removeFileAndEmptyDirectories(viewExportPath);
      removeFileAndEmptyDirectories(viewTypesFilePath);
    }
  };

  const watcher = metro?.getBundler().getBundler().getWatcher();
  const eventTypes = ['add', 'delete', 'change'];

  const isWatchedFileEvent = (event: Event, watchedDirAncestor: string | null): boolean => {
    return (
      event.metadata?.type !== 'd' &&
      isValidLocalModuleFileName(path.basename(event.filePath)) &&
      !isFileExcluded(event.filePath) &&
      !!watchedDirAncestor
    );
  };

  const listener = async ({ eventsQueue }: { eventsQueue: EventsQueue }) => {
    for (const event of eventsQueue) {
      const watchedDirAncestor = getWatchedDirAncestorAbsolutePath(
        projectRoot,
        path.resolve(event.filePath)
      );
      if (
        eventTypes.includes(event.type) &&
        isWatchedFileEvent(event, watchedDirAncestor) &&
        !!watchedDirAncestor
      ) {
        const { filePath } = event;
        if (event.type === 'add') {
          onSourceFileCreated(projectRoot, watchedDirAncestor, filePath, filesWatched);
        } else if (event.type === 'delete') {
          onSourceFileRemoved(filePath, watchedDirAncestor);
        }
      }
    }
  };

  watcher?.addListener('change', listener);

  await generateMirrorDirectories(projectRoot, filesWatched);
}
