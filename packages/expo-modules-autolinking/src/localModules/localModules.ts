import fs from 'fs';
import path from 'path';

export type LocalModulesMirror = {
  files: { filePath: string; watchedDirRoot: string }[];
  swiftModuleClassNames: string[];
  kotlinClasses: string[];
};

/** Look up directories until one with a `package.json` can be found, assert if none can be found. */
function findUpProjectRootOrAssert(cwd: string): string {
  const projectRoot = findUpProjectRoot(cwd);
  if (!projectRoot) {
    throw new Error(`Project root directory not found (working directory: ${cwd})`);
  }
  return projectRoot;
}

function findUpProjectRoot(cwd: string): string | null {
  const packageJsonPath = path.resolve(cwd, './package.json');
  if (fs.existsSync(packageJsonPath)) {
    return path.dirname(packageJsonPath);
  }

  const parent = path.dirname(cwd);
  if (parent === cwd) return null;

  return findUpProjectRoot(parent);
}

export async function getAppRoot(): Promise<string> {
  const cwd = process.cwd();
  const result = await findUpProjectRootOrAssert(cwd);
  if (!result) {
    throw new Error(`Couldn't find "package.json" up from path "${cwd}"`);
  }
  return result;
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

function trimExtension(fileName: string) {
  return fileName.substring(0, fileName.lastIndexOf('.'));
}

function getKotlinFileNameWithItsPackage(absoluteFilePath: string): string {
  const pacakgeRegex = /^package\s+/;
  const lines = fs.readFileSync(absoluteFilePath).toString().split('\n');
  const packageLine = lines.findIndex((line) => pacakgeRegex.test(line));
  if (packageLine < 0) {
    return '';
  }
  const packageName = lines[packageLine].substring('package '.length);
  return packageName + '.' + trimExtension(path.basename(absoluteFilePath));
}

function getSwiftModuleClassName(absoluteFilePath: string): string {
  return trimExtension(path.basename(absoluteFilePath));
}

export async function getMirrorStateObject(watchedDirs: string[]): Promise<LocalModulesMirror> {
  const appRoot = await getAppRoot();
  const localModulesMirror: LocalModulesMirror = {
    kotlinClasses: [],
    swiftModuleClassNames: [],
    files: [],
  };

  const recursivelyScanDirectory = async (absoluteDirPath: string, watchedDirRoot: string) => {
    const dir = fs.opendirSync(absoluteDirPath);
    for await (const dirent of dir) {
      const absoluteDirentPath = path.resolve(absoluteDirPath, dirent.name);
      if (dirent.isDirectory()) {
        await recursivelyScanDirectory(absoluteDirentPath, watchedDirRoot);
      }
      if (!dirent.isFile() || !isValidLocalModuleFileName(dirent.name)) {
        continue;
      }

      if (/\.(kt)$/.test(dirent.name)) {
        const kotlinFileWithPackage = getKotlinFileNameWithItsPackage(absoluteDirentPath);
        localModulesMirror.kotlinClasses.push(kotlinFileWithPackage);
        localModulesMirror.files.push({ filePath: absoluteDirentPath, watchedDirRoot });
      } else if (/\.(swift)$/.test(dirent.name)) {
        const swiftClassName = getSwiftModuleClassName(absoluteDirentPath);
        localModulesMirror.swiftModuleClassNames.push(swiftClassName);
        localModulesMirror.files.push({ filePath: absoluteDirentPath, watchedDirRoot });
      }
    }
  };

  for (const dir of watchedDirs ?? []) {
    await recursivelyScanDirectory(
      path.resolve(appRoot, dir),
      fs.realpathSync(path.resolve(appRoot, dir))
    );
  }
  return localModulesMirror;
}
