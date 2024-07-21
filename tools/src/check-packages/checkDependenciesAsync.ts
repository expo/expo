import { glob } from 'glob';
import { isBuiltin } from 'node:module';
import path from 'node:path';
import ts from 'typescript';

import type { ActionOptions } from './types';
import Logger from '../Logger';
import { DependencyKind, type PackageDependency, type Package } from '../Packages';

type PackageCheckType = ActionOptions['checkPackageType'];

type SourceFile = {
  path: string;
  type: 'source' | 'test';
};

type SourceFileImportRef = {
  packageName: string;
  packagePath?: string;
  isTypeOnly?: boolean;
};

type SourceFileImports = {
  internal: SourceFileImportRef[];
  external: SourceFileImportRef[];
  builtIn: SourceFileImportRef[];
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
  'expo-doctor',
  'expo-font',
  'expo-gl',
  'expo-image',
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
  'jest-expo',
  'patch-project',
];

/**
 * Checks whether the package has valid dependency chains for each (external) import.
 *
 * @param pkg Package to check
 * @param type What part of the package needs to be checked
 */
export async function checkDependenciesAsync(pkg: Package, type: PackageCheckType = 'package') {
  if (IGNORED_PACKAGES.includes(pkg.packageName)) {
    return;
  }

  const sources = (await getSourceFilesAsync(pkg, type))
    .filter((file) => file.type === 'source')
    .map((file) => ({ file, importRefs: getSourceFileImports(file) }));

  if (!sources.length) {
    return;
  }

  const isValidImport = createImportValidator(pkg);
  const invalidImports: { file: SourceFile; importRef: SourceFileImportRef }[] = [];

  for (const source of sources) {
    for (const importRef of source.importRefs.external) {
      if (!isValidImport(importRef)) {
        invalidImports.push({ file: source.file, importRef });
      }
    }
  }

  if (invalidImports.length) {
    const importAreTypesOnly = invalidImports.every(({ importRef }) => importRef.isTypeOnly);
    const importPackageNames = [
      ...new Set(invalidImports.map(({ importRef }) => importRef.packageName)),
    ];

    Logger.warn(
      importPackageNames.length === 1
        ? `📦 Invalid dependency${importAreTypesOnly ? ' (types only)' : ''}: ${importPackageNames.join(', ')}`
        : `📦 Invalid dependencies${importAreTypesOnly ? ' (types only)' : ''}: ${importPackageNames.join(', ')}`
    );

    invalidImports.forEach(({ file, importRef }) => {
      const importPath = importRef.packagePath
        ? `${importRef.packageName}/${importRef.packagePath}`
        : `${importRef.packageName}`;

      Logger.verbose(
        `     > ${path.relative(pkg.path, file.path)} - ${importPath}${importRef.isTypeOnly ? ' (types only)' : ''}`
      );
    });

    if (!importAreTypesOnly) {
      throw new Error(`${pkg.packageName} has invalid dependency chains.`);
    }
  }
}

/**
 * Create a filter guard that validates any import reference against the package dependencies.
 * The filter only returns valid imports by checking:
 *   - If the imported package name is equal to the current package name (e.g. for scripts)
 *   - If the imported package name is in the package dependencies, devDependencies, or peerDependencies
 */
function createImportValidator(pkg: Package) {
  const dependencyMap = new Map<string, null | PackageDependency>();
  const dependencies = pkg.getDependencies([
    DependencyKind.Normal,
    DependencyKind.Dev,
    DependencyKind.Peer,
  ]);

  IGNORED_IMPORTS.forEach((dependency) => dependencyMap.set(dependency, null));
  dependencies.forEach((dependency) => dependencyMap.set(dependency.name, dependency));

  return (ref: SourceFileImportRef) =>
    pkg.packageName === ref.packageName || dependencyMap.has(ref.packageName);
}

/** Get a list of all source files to validate for dependency chains */
async function getSourceFilesAsync(pkg: Package, type: PackageCheckType): Promise<SourceFile[]> {
  const files = await glob('src/**/*.{ts,tsx,js,jsx}', {
    cwd: getSourceFilePaths(pkg, type),
    absolute: true,
    nodir: true,
  });

  return files
    .filter((filePath) => !filePath.endsWith('.d.ts'))
    .map((filePath) =>
      filePath.includes('/__tests__/') || filePath.includes('/__mocks__/')
        ? { path: filePath, type: 'test' }
        : { path: filePath, type: 'source' }
    );
}

/** Get the path of source files based on the package, and the type of check currently running */
function getSourceFilePaths(pkg: Package, type: PackageCheckType): string {
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

/** Parse and return all imports from a single source file, usign TypeScript AST parsing */
function getSourceFileImports(sourceFile: SourceFile): SourceFileImports {
  const imports: SourceFileImports = { internal: [], external: [], builtIn: [] };
  const compiler = createTypescriptCompiler();
  const source = compiler.getSourceFile(sourceFile.path, ts.ScriptTarget.Latest, (message) => {
    throw new Error(`Failed to parse ${sourceFile.path}: ${message}`);
  });

  if (source) {
    return collectTypescriptImports(source, imports);
  }

  return imports;
}

/** Iterate the parsed TypeScript AST and collect all imports or require statements */
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

/** The shared but lazily initialized TypeScript compiler instance */
let compiler: ts.CompilerHost | null = null;

/** Get or create the TypeScript compiler used to analyze imports for all source files */
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
