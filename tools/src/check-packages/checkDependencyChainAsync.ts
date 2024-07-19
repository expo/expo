import { glob } from 'glob';
import { isBuiltin } from 'node:module';
import path from 'node:path';
import ts from 'typescript';

import type { ActionOptions } from './types';
import Logger from '../Logger';
import { DependencyKind, PackageDependency, type Package } from '../Packages';

type PackageType = ActionOptions['checkPackageType'];

type SourceFile = {
  path: string;
  type: 'source' | 'test';
};

type SourceFileImport = {
  packageName: string;
  packagePath?: string;
  isTypeOnly?: boolean;
};

type SourceFileImports = {
  internal: SourceFileImport[];
  external: SourceFileImport[];
  builtIn: SourceFileImport[];
};

// We are incrementally rolling this out, the imports in this list are expected to be invalid
const IGNORED_IMPORTS = ['expo-modules-core'];
// We are incrementally rolling this out, the sdk packages in this list are expected to be invalid
const IGNORED_PACKAGES = [
  '@expo/cli',
  '@expo/html-elements',
  '@expo/image-utils',
  '@expo/metro-config',
  '@expo/metro-runtime',
  '@expo/prebuild-config',
  'babel-preset-expo',
  'expo-apple-authentication',
  'expo-asset',
  'expo-auth-session',
  'expo-av',
  'expo-camera',
  'expo-checkbox',
  'expo-clipboard',
  'expo-dev-client-components',
  'expo-dev-client',
  'expo-doctor',
  'expo-font',
  'expo-gl',
  'expo-image-picker',
  'expo-image',
  'expo-localization',
  'expo-modules-core',
  'expo-modules-test-core',
  'expo-navigation-bar',
  'expo-router',
  'expo-sqlite',
  'expo-status-bar',
  'expo-store-review',
  'expo-symbols',
  'expo-system-ui',
  'expo-updates',
  'expo-video',
  'jest-expo',
  'patch-project',
];

/**
 * Checks whether the package has valid dependency chains for each import.
 * @param pkg Package to check
 * @param type What part of the package needs to be checked
 * @param match Path or pattern of the files to match
 */
export async function checkDependencyChainAsync(pkg: Package, type: PackageType = 'package') {
  if (IGNORED_PACKAGES.includes(pkg.packageName)) {
    return;
  }

  const sources = (await getSourceFilesAsync(pkg, type))
    .filter((file) => file.type === 'source')
    .map((file) => ({ file, imports: getSourceFileImports(pkg, file) }));

  if (!sources.length) {
    return;
  }

  const importValidator = createDependencyChainValidator(pkg);
  const invalidImports: { file: SourceFile; importRef: SourceFileImport }[] = [];

  for (const source of sources) {
    for (const importRef of source.imports.external) {
      if (!importValidator(importRef)) {
        invalidImports.push({ file: source.file, importRef });
      }
    }
  }

  if (invalidImports.length) {
    const importAreTypesOnly = invalidImports.every(({ importRef }) => importRef.isTypeOnly);
    const dependencyList = [...invalidImports].map(({ importRef }) => importRef.packageName);
    const uniqueDependencies = [...new Set(dependencyList)];

    Logger.warn(
      uniqueDependencies.length === 1
        ? `📦 Invalid dependency${importAreTypesOnly ? ' (types only)' : ''}: ${uniqueDependencies.join(', ')}`
        : `📦 Invalid dependencies${importAreTypesOnly ? ' (types only)' : ''}: ${uniqueDependencies.join(', ')}`
    );

    invalidImports.forEach(({ file, importRef }) => {
      const properties = importRef.isTypeOnly ? ' (types only)' : '';
      const fullImport = importRef.packagePath
        ? `${importRef.packageName}/${importRef.packagePath}`
        : `${importRef.packageName}`;

      Logger.verbose(`     > ${path.relative(pkg.path, file.path)} - ${fullImport}${properties}`);
    });

    if (!importAreTypesOnly) {
      throw new Error(`${pkg.packageName} has invalid dependency chains.`);
    }
  }
}

function createDependencyChainValidator(pkg: Package) {
  const dependencyMap = new Map<string, null | PackageDependency>();
  const dependencies = pkg.getDependencies([
    DependencyKind.Normal,
    DependencyKind.Dev,
    DependencyKind.Peer,
  ]);

  IGNORED_IMPORTS.forEach((dependency) => dependencyMap.set(dependency, null));
  dependencies.forEach((dependency) => dependencyMap.set(dependency.name, dependency));

  return (ref: SourceFileImport) =>
    pkg.packageName === ref.packageName || dependencyMap.has(ref.packageName);
}

/** Get a list of all source files to validate for dependency chains */
async function getSourceFilesAsync(pkg: Package, type: PackageType): Promise<SourceFile[]> {
  const cwd = getPackageTypePath(pkg, type);
  const files = await glob('src/**/*.{ts,tsx,js,jsx}', { cwd, absolute: true, nodir: true });

  return files.map((filePath) =>
    filePath.includes('__tests__') || filePath.includes('__mocks__')
      ? { path: filePath, type: 'test' }
      : { path: filePath, type: 'source' }
  );
}

function getPackageTypePath(pkg: Package, type: PackageType): string {
  switch (type) {
    case 'package':
      return pkg.path;

    case 'plugin':
    case 'cli':
    case 'utils':
      return path.join(pkg.path, type);

    default:
      throw new Error(`Unexpected package type received: ${type}`);
  }
}

function getSourceFileImports(pkg: Package, sourceFile: SourceFile): SourceFileImports {
  const compiler = createTypescriptCompiler();
  const imports: SourceFileImports = { internal: [], external: [], builtIn: [] };
  const source = compiler.getSourceFile(sourceFile.path, ts.ScriptTarget.Latest, (message) => {
    throw new Error(`Failed to parse ${sourceFile.path}: ${message}`);
  });

  if (source) {
    return collectTypescriptImports(source, imports);
  }

  return imports;
}

function collectTypescriptImports(node: ts.Node | ts.SourceFile, imports: SourceFileImports) {
  if (ts.isImportDeclaration(node)) {
    // Collect `import` statements
    storeTypescriptImport(imports, node.moduleSpecifier.getText(), node.importClause?.isTypeOnly);
  } else if (
    ts.isCallExpression(node) &&
    node.expression.getText() === 'require' &&
    node.arguments.every((arg) => ts.isStringLiteral(arg)) // Filter `require(requireFrom(...))
  ) {
    // Collect `require` statement
    storeTypescriptImport(imports, node.arguments[0].getText());
  } else {
    ts.forEachChild(node, (child) => {
      collectTypescriptImports(child, imports);
    });
  }

  return imports;
}

function storeTypescriptImport(
  store: SourceFileImports,
  importText: string,
  importTypeOnly?: boolean
): void {
  const importRef = importText.replace(/['"]/g, '');

  if (isBuiltin(importRef)) {
    store.builtIn.push({ packageName: importRef, isTypeOnly: importTypeOnly });
  } else if (importRef.startsWith('.')) {
    store.internal.push({ packageName: importRef, isTypeOnly: importTypeOnly });
  } else if (importRef.startsWith('@')) {
    const [packageScope, packageName, ...packagePath] = importRef.split('/');
    store.external.push({
      packageName: `${packageScope}/${packageName}`,
      packagePath: packagePath.join('/'),
      isTypeOnly: importTypeOnly,
    });
  } else {
    const [packageName, ...packagePath] = importRef.split('/');
    store.external.push({
      packageName,
      packagePath: packagePath.join('/'),
      isTypeOnly: importTypeOnly,
    });
  }
}

let compiler: ts.CompilerHost | null = null;
function createTypescriptCompiler() {
  if (!compiler) {
    compiler = ts.createCompilerHost(
      {
        allowJs: true,
        noEmit: true,
        isolatedModules: true,
        resolveJsonModule: false,
        moduleResolution: ts.ModuleResolutionKind.Classic, // we don't want node_modules
        incremental: true,
        noLib: true,
        noResolve: true,
      },
      true
    );
  }

  return compiler;
}
