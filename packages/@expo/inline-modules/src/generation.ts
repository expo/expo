import { getConfig } from '@expo/config';
import Server from '@expo/metro/metro/Server';
import * as fs from 'fs';
import * as path from 'path';

import { Event, EventsQueue } from './generation.types';

export interface ModuleGenerationArguments {
  projectRoot: string;
  metro: Server | null;
}

const nativeExtensions = ['.kt', '.swift'];
export function isValidInlineModuleFileName(fileName: string): boolean {
  return nativeExtensions.includes(path.extname(fileName));
}

export function trimExtension(fileName: string): string {
  const extensionStart = fileName.lastIndexOf('.');
  if (extensionStart >= 0) {
    return fileName.substring(0, extensionStart);
  }
  return fileName;
}

const EXCLUDE_GLOBS = [
  '.expo/**/*',
  'node_modules/**/*',
  'android/**/*',
  'ios/**/*',
  'modules/**/*',
];

export function getProjectExcludePathsGlobs(projectRoot: string): string[] {
  return EXCLUDE_GLOBS.map((glob) => path.resolve(projectRoot, glob));
}

export function isFilePathExcluded(filePath: string, excludePathsGlobs: string[]): boolean {
  for (const glob of excludePathsGlobs) {
    if (path.matchesGlob(filePath, glob)) {
      return true;
    }
  }
  return false;
}

export function getMirrorDirectoriesPaths(dotExpoDir: string): {
  inlineModulesModulesPath: string;
  inlineModulesTypesPath: string;
} {
  const inlineModulesPath = path.resolve(dotExpoDir, './inlineModules/');

  const inlineModulesModulesPath = path.resolve(inlineModulesPath, 'modules');
  const inlineModulesTypesPath = path.resolve(inlineModulesPath, 'types');

  return {
    inlineModulesModulesPath,
    inlineModulesTypesPath,
  };
}

export function findUpPackageJsonDirectoryCached(
  cwd: string,
  directoryToPackage: Map<string, string>
): string | undefined {
  if (['.', path.sep].includes(cwd)) return undefined;
  if (directoryToPackage.has(cwd)) return directoryToPackage.get(cwd);

  const packageFound = fs.existsSync(path.resolve(cwd, './package.json'));
  if (packageFound) {
    directoryToPackage.set(cwd, cwd);
    return cwd;
  }
  const packageRoot = findUpPackageJsonDirectoryCached(path.dirname(cwd), directoryToPackage);
  if (packageRoot) {
    directoryToPackage.set(cwd, packageRoot);
  }
  return packageRoot;
}

export async function createFreshMirrorDirectories(dotExpoDir: string): Promise<void> {
  const { inlineModulesModulesPath, inlineModulesTypesPath } =
    getMirrorDirectoriesPaths(dotExpoDir);

  const rmPromises = [];
  if (fs.existsSync(inlineModulesModulesPath)) {
    rmPromises.push(fs.promises.rm(inlineModulesModulesPath, { recursive: true, force: true }));
  }
  if (fs.existsSync(inlineModulesTypesPath)) {
    rmPromises.push(fs.promises.rm(inlineModulesTypesPath, { recursive: true, force: true }));
  }
  await Promise.all(rmPromises);
  await Promise.all([
    fs.promises.mkdir(inlineModulesModulesPath, { recursive: true }),
    fs.promises.mkdir(inlineModulesTypesPath, { recursive: true }),
  ]);
}

export function typesAndModulePathsForFile(
  dotExpoDir: string,
  watchedDirRootAbsolutePath: string,
  absoluteFilePath: string,
  directoryToPackage: Map<string, string>
): {
  moduleTypesFilePath: string;
  viewTypesFilePath: string;
  viewExportPath: string;
  moduleExportPath: string;
  moduleName: string;
} {
  const { inlineModulesModulesPath, inlineModulesTypesPath } =
    getMirrorDirectoriesPaths(dotExpoDir);
  const fileName = path.basename(absoluteFilePath);
  const moduleName = trimExtension(fileName);

  const watchedDirProjectRoot = findUpPackageJsonDirectoryCached(
    watchedDirRootAbsolutePath,
    directoryToPackage
  );
  if (!watchedDirProjectRoot) {
    throw Error('Watched directory is not inside a project with package.json!');
  }
  const filePathRelativeToTSProjectRoot = path.relative(watchedDirProjectRoot, absoluteFilePath);
  const filePathRelativeToTSProjectRootWithoutExtension = trimExtension(
    filePathRelativeToTSProjectRoot
  );

  const moduleTypesFilePath = path.resolve(
    inlineModulesTypesPath,
    filePathRelativeToTSProjectRootWithoutExtension + '.module.d.ts'
  );
  const viewTypesFilePath = path.resolve(
    inlineModulesTypesPath,
    filePathRelativeToTSProjectRootWithoutExtension + '.view.d.ts'
  );
  const moduleExportPath = path.resolve(
    inlineModulesModulesPath,
    filePathRelativeToTSProjectRootWithoutExtension + '.module.js'
  );
  const viewExportPath = path.resolve(
    inlineModulesModulesPath,
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

function getWatchedDirAncestorAbsolutePath(
  projectRoot: string,
  filePathAbsolute: string
): string | null {
  const watchedDirectories =
    getConfig(projectRoot).exp.experiments?.inlineModules?.watchedDirectories ?? [];
  const realRoot = path.resolve(projectRoot);
  for (const dir of watchedDirectories) {
    const dirPathAbsolute = path.resolve(realRoot, dir);
    if (filePathAbsolute.startsWith(dirPathAbsolute)) {
      return dirPathAbsolute;
    }
  }
  return null;
}

async function onSourceFileCreated(
  dotExpoDir: string,
  watchedDirRootAbsolutePath: string,
  absoluteFilePath: string,
  directoryToPackage: Map<string, string>,
  filesWatched?: Set<string>
): Promise<void> {
  const { moduleTypesFilePath, viewTypesFilePath, viewExportPath, moduleExportPath, moduleName } =
    typesAndModulePathsForFile(
      dotExpoDir,
      watchedDirRootAbsolutePath,
      absoluteFilePath,
      directoryToPackage
    );

  if (filesWatched && fileWatchedWithAnyNativeExtension(absoluteFilePath, filesWatched)) {
    filesWatched.add(absoluteFilePath);
    return;
  }
  if (filesWatched) {
    filesWatched.add(absoluteFilePath);
  }

  await Promise.all([
    fs.promises.mkdir(path.dirname(moduleExportPath), { recursive: true }),
    fs.promises.mkdir(path.dirname(moduleTypesFilePath), { recursive: true }),
  ]);

  const writeFilePromises = [];
  if (!fs.existsSync(viewExportPath)) {
    writeFilePromises.push(
      fs.promises.writeFile(
        viewExportPath,
        `import { requireNativeView } from 'expo';
export default requireNativeView("${moduleName}");`
      )
    );
  }
  if (!fs.existsSync(moduleExportPath)) {
    writeFilePromises.push(
      fs.promises.writeFile(
        moduleExportPath,
        `import { requireNativeModule } from 'expo';
export default requireNativeModule("${moduleName}");`
      )
    );
  }
  if (!fs.existsSync(viewTypesFilePath)) {
    fs.promises.writeFile(
      viewTypesFilePath,
      `import React from "react"
const _default: React.JSX.ElementType
export default _default`
    );
  }
  if (!fs.existsSync(moduleTypesFilePath)) {
    fs.promises.writeFile(
      moduleTypesFilePath,
      `const _default: any
export default _default`
    );
  }

  await Promise.all(writeFilePromises);
}

export async function generateMirrorDirectories(
  projectRoot: string,
  filesWatched?: Set<string>,
  directoryToPackage: Map<string, string> = new Map<string, string>()
): Promise<void> {
  const dotExpoDir: string = path.resolve(projectRoot, '.expo');
  await createFreshMirrorDirectories(dotExpoDir);

  const generateExportsAndTypesForDirectory = async (
    absoluteDirPath: string,
    watchedDirRootAbsolutePath: string
  ) => {
    if (isFilePathExcluded(absoluteDirPath, getProjectExcludePathsGlobs(projectRoot))) {
      return;
    }

    const dir = await fs.promises.opendir(absoluteDirPath);
    for await (const dirent of dir) {
      const absoluteDirentPath = path.resolve(absoluteDirPath, dirent.name);
      if (
        dirent.isFile() &&
        isValidInlineModuleFileName(dirent.name) &&
        absoluteDirentPath.startsWith(watchedDirRootAbsolutePath)
      ) {
        await onSourceFileCreated(
          dotExpoDir,
          watchedDirRootAbsolutePath,
          absoluteDirentPath,
          directoryToPackage,
          filesWatched
        );
      } else if (dirent.isDirectory()) {
        await generateExportsAndTypesForDirectory(absoluteDirentPath, watchedDirRootAbsolutePath);
      }
    }
  };

  const watchedDirectories =
    getConfig(projectRoot).exp.experiments?.inlineModules?.watchedDirectories ?? [];
  for (const watchedDirectory of watchedDirectories) {
    await generateExportsAndTypesForDirectory(
      path.resolve(projectRoot, watchedDirectory),
      await fs.promises.realpath(watchedDirectory)
    );
  }
}

let inlineModulesWatcherListener: any = null;

export function removeInlineModulesWatcherListener(metro: Server) {
  if (inlineModulesWatcherListener) {
    metro
      .getBundler()
      .getBundler()
      .getWatcher()
      .removeListener('change', inlineModulesWatcherListener);
  }
}

export async function startInlineModulesMetroWatcherAsync(
  { projectRoot, metro }: ModuleGenerationArguments,
  filesWatched: Set<string> = new Set<string>(),
  directoryToPackage: Map<string, string> = new Map<string, string>()
): Promise<void> {
  const dotExpoDir = path.resolve(projectRoot, '.expo');
  const removeFileAndEmptyDirectories = async (absoluteFilePath: string) => {
    await fs.promises.rm(absoluteFilePath);
    let dirNow: string = path.dirname(absoluteFilePath);
    while ((await fs.promises.readdir(dirNow)).length === 0 && dirNow !== dotExpoDir) {
      await fs.promises.rmdir(dirNow);
      dirNow = path.dirname(dirNow);
    }
  };

  const onSourceFileRemoved = async (
    absoluteFilePath: string,
    watchedDirRootAbsolutePath: string
  ) => {
    const { moduleTypesFilePath, moduleExportPath, viewExportPath, viewTypesFilePath } =
      typesAndModulePathsForFile(
        dotExpoDir,
        watchedDirRootAbsolutePath,
        absoluteFilePath,
        directoryToPackage
      );

    filesWatched.delete(absoluteFilePath);
    if (!fileWatchedWithAnyNativeExtension(absoluteFilePath, filesWatched)) {
      await Promise.all([
        removeFileAndEmptyDirectories(moduleTypesFilePath),
        removeFileAndEmptyDirectories(moduleExportPath),
        removeFileAndEmptyDirectories(viewExportPath),
        removeFileAndEmptyDirectories(viewTypesFilePath),
      ]);
    }
  };

  const watcher = metro?.getBundler().getBundler().getWatcher();
  const eventTypes = ['add', 'delete'];
  const excludePathsGlobs = getProjectExcludePathsGlobs(projectRoot);

  const isWatchedFileEvent = (event: Event, watchedDirAncestor: string | null): boolean => {
    return (
      isValidInlineModuleFileName(path.basename(event.filePath)) &&
      !isFilePathExcluded(event.filePath, excludePathsGlobs) &&
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
          await onSourceFileCreated(
            dotExpoDir,
            watchedDirAncestor,
            filePath,
            directoryToPackage,
            filesWatched
          );
        } else if (event.type === 'delete') {
          await onSourceFileRemoved(filePath, watchedDirAncestor);
        }
      }
    }
  };

  inlineModulesWatcherListener = listener;
  watcher?.addListener('change', listener);
}
