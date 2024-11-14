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
  type: 'builtIn' | 'internal' | 'external';
  importValue: string;
  packageName: string;
  packagePath?: string;
  isTypeOnly?: boolean;
};

// We are incrementally rolling this out, the imports in this list are expected to be invalid
const IGNORED_IMPORTS = ['expo-modules-core', 'typescript'];
// We are incrementally rolling this out, the sdk packages in this list are expected to be invalid
const IGNORED_PACKAGES = [
  '@expo/cli', // package: @react-native-community/cli-server-api, expo-modules-autolinking, expo-router, express, metro-*, webpack, webpack-dev-server
  '@expo/html-elements', // package: react, react-native, react-native-web
  '@expo/image-utils', // package: sharp, sharp-cli
  '@expo/metro-config', // package: @babel/*, babel-preset-expo, hermes-parser, metro, metro-*
  '@expo/metro-runtime', // package: anser, expo, expo-constants, metro-runtime, pretty-format, react, react-dom, react-native-web, react-refresh, stacktrace-parser
  'babel-preset-expo', // package: @babel/*, debug, expo, react-native-reanimated, resolve-from
  'expo-asset', // package: @react-native/assets-registry, expo-updates (types only)
  'expo-av', // package: expo-asset
  'expo-font', // package: expo-asset
  'expo-gl', // package: react-dom, react-native-reanimated
  'expo-image', // package: @react-native/assets-registry
  'expo-modules-core', // package: react, react-native
  'expo-router', // package: @react-navigation/core, @react-navigation/routers, debug, escape-string-regexp, expect, expo-font, fast-deep-equal, nanoid, react, react-dom, react-native, react-native-web
  'expo-sqlite', // package: expo-asset
  'expo-store-review', // package: expo-constants
  'expo-updates', // cli: @expo/plist, debug, getenv - utils: @expo/cli, @expo/metro-config, metro
  'expo-video', // package: @react-native/assets-registry
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

  const isValidExternalImport = createExternalImportValidator(pkg);
  const invalidImports: { file: SourceFile; importRef: SourceFileImportRef }[] = [];

  for (const source of sources) {
    source.importRefs
      .filter((importRef) => !isValidExternalImport(importRef))
      .forEach((importRef) => invalidImports.push({ file: source.file, importRef }));
  }

  if (invalidImports.length) {
    const importAreTypesOnly = invalidImports.every(({ importRef }) => importRef.isTypeOnly);
    const importPackageNames = [
      ...new Set(invalidImports.map(({ importRef }) => importRef.packageName).sort()),
    ];

    const checkStateText = importAreTypesOnly ? 'Risky' : 'Invalid';
    const dependencyText = importPackageNames.length === 1 ? 'dependency' : 'dependencies';

    Logger.warn(`📦 ${checkStateText} ${dependencyText}: ${importPackageNames.join(', ')}`);

    invalidImports.forEach(({ file, importRef }) => {
      Logger.verbose(
        `     > ${path.relative(pkg.path, file.path)} - ${importRef.importValue}${importRef.isTypeOnly ? ' (types only)' : ''}`
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
 *   - If the imported package is an external import (e.g. importing a package)
 *   - If the imported package name is equal to the current package name (e.g. for scripts)
 *   - If the imported package name is in the package dependencies, devDependencies, or peerDependencies
 */
function createExternalImportValidator(pkg: Package) {
  const dependencyMap = new Map<string, null | PackageDependency>();
  const dependencies = pkg.getDependencies([
    DependencyKind.Normal,
    DependencyKind.Dev,
    DependencyKind.Peer,
  ]);

  IGNORED_IMPORTS.forEach((dependency) => dependencyMap.set(dependency, null));
  dependencies.forEach((dependency) => dependencyMap.set(dependency.name, dependency));

  return (ref: SourceFileImportRef) =>
    ref.type !== 'external' ||
    pkg.packageName === ref.packageName ||
    dependencyMap.has(ref.packageName);
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
function getSourceFileImports(sourceFile: SourceFile): SourceFileImportRef[] {
  const importRefs: SourceFileImportRef[] = [];
  const compiler = createTypescriptCompiler();
  const source = compiler.getSourceFile(sourceFile.path, ts.ScriptTarget.Latest, (message) => {
    throw new Error(`Failed to parse ${sourceFile.path}: ${message}`);
  });

  if (source) {
    return collectTypescriptImports(source, importRefs);
  }

  return importRefs;
}

/** Iterate the parsed TypeScript AST and collect all imports or require statements */
function collectTypescriptImports(node: ts.Node | ts.SourceFile, imports: SourceFileImportRef[]) {
  if (ts.isImportDeclaration(node)) {
    // Collect `import` statements
    imports.push(
      createTypescriptImportRef(node.moduleSpecifier.getText(), node.importClause?.isTypeOnly)
    );
  } else if (
    ts.isCallExpression(node) &&
    node.expression.getText() === 'require' &&
    node.arguments.every((arg) => ts.isStringLiteral(arg)) // Filter `require(requireFrom(...))
  ) {
    // Collect `require` statement
    imports.push(createTypescriptImportRef(node.arguments[0].getText()));
  } else {
    ts.forEachChild(node, (child) => {
      collectTypescriptImports(child, imports);
    });
  }

  return imports;
}

/** Analyze the import and return the import ref object */
function createTypescriptImportRef(
  importText: string,
  importTypeOnly = false
): SourceFileImportRef {
  const importValue = importText.replace(/['"]/g, '');

  if (isBuiltin(importValue)) {
    return { type: 'builtIn', importValue, packageName: importValue, isTypeOnly: importTypeOnly };
  }

  if (importValue.startsWith('.')) {
    return { type: 'internal', importValue, packageName: importValue, isTypeOnly: importTypeOnly };
  }

  if (importValue.startsWith('@')) {
    const [packageScope, packageName, ...packagePath] = importValue.split('/');
    return {
      type: 'external',
      importValue,
      packageName: `${packageScope}/${packageName}`,
      packagePath: packagePath.join('/'),
      isTypeOnly: importTypeOnly,
    };
  }

  const [packageName, ...packagePath] = importValue.split('/');
  return {
    type: 'external',
    importValue,
    packageName,
    packagePath: packagePath.join(','),
    isTypeOnly: importTypeOnly,
  };
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
