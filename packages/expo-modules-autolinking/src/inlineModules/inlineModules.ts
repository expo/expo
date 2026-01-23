import fs from 'fs';
import path from 'path';

export type InlineModulesMirror = {
  files: { filePath: string; watchedDirRoot: string }[];
  swiftModuleClassNames: string[];
  kotlinClasses: string[];
};

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
  const result = findUpProjectRoot(cwd);
  if (!result) {
    throw new Error(`Couldn't find "package.json" up from path "${cwd}"`);
  }
  return result;
}

const nativeExtensions = ['.kt', '.swift'];

function isValidInlineModuleFileName(fileName: string): boolean {
  const ext = path.extname(fileName);
  if (!nativeExtensions.includes(ext)) {
    return false;
  }

  const baseName = path.basename(fileName, ext);
  return !baseName.includes('.');
}

function trimExtension(fileName: string) {
  return fileName.substring(0, fileName.lastIndexOf('.'));
}

async function getKotlinFileNameWithItsPackage(absoluteFilePath: string): Promise<string> {
  const HEADER_SIZE = 512;
  const buffer = Buffer.alloc(HEADER_SIZE);

  const fileHandle = await fs.promises.open(absoluteFilePath, 'r');
  try {
    const { bytesRead } = await fileHandle.read(buffer, 0, HEADER_SIZE, 0);
    const header = buffer.toString('utf8', 0, bytesRead);

    // We want to find `package some.package` and capture the `some.package` from it.
    const pacakgeRegex = /^package\s+([\w.]+)/m;
    const packageMatch = header.match(pacakgeRegex);
    if (!packageMatch) {
      return '';
    }

    return `${packageMatch[1]}.${trimExtension(path.basename(absoluteFilePath))}`;
  } finally {
    await fileHandle.close();
  }
}

function getSwiftModuleClassName(absoluteFilePath: string): string {
  return trimExtension(path.basename(absoluteFilePath));
}

export async function getMirrorStateObject(
  watchedDirectories: string[]
): Promise<InlineModulesMirror> {
  const appRoot = await getAppRoot();
  const inlineModulesMirror: InlineModulesMirror = {
    kotlinClasses: [],
    swiftModuleClassNames: [],
    files: [],
  };

  const recursivelyScanDirectory = async (absoluteDirPath: string, watchedDirRoot: string) => {
    const dir = await fs.promises.opendir(absoluteDirPath);
    for await (const dirent of dir) {
      const absoluteDirentPath = path.resolve(absoluteDirPath, dirent.name);
      if (dirent.isDirectory()) {
        await recursivelyScanDirectory(absoluteDirentPath, watchedDirRoot);
      }
      if (!dirent.isFile() || !isValidInlineModuleFileName(dirent.name)) {
        continue;
      }

      if (/\.(kt)$/.test(dirent.name)) {
        const kotlinFileWithPackage = await getKotlinFileNameWithItsPackage(absoluteDirentPath);
        inlineModulesMirror.kotlinClasses.push(kotlinFileWithPackage);
        inlineModulesMirror.files.push({ filePath: absoluteDirentPath, watchedDirRoot });
      } else if (/\.(swift)$/.test(dirent.name)) {
        const swiftClassName = getSwiftModuleClassName(absoluteDirentPath);
        inlineModulesMirror.swiftModuleClassNames.push(swiftClassName);
        inlineModulesMirror.files.push({ filePath: absoluteDirentPath, watchedDirRoot });
      }
    }
  };

  for (const dir of watchedDirectories ?? []) {
    const absoluteDirPath = path.resolve(appRoot, dir);
    const watchedDirRoot = fs.realpathSync(path.resolve(appRoot, dir));

    await recursivelyScanDirectory(absoluteDirPath, watchedDirRoot);
  }
  return inlineModulesMirror;
}
