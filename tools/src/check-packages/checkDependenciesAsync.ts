import { glob } from 'glob';
import { isBuiltin } from 'node:module';
import path from 'node:path';
import ts from 'typescript';

import type { ActionOptions } from './types';
import Logger from '../Logger';
import { DependencyKind, type PackageDependency, type Package } from '../Packages';

type PackageCheckType = ActionOptions['checkPackageType'];

/** The three levels of of which dangerous dependencies are allowed.
 * @remarks
 * We can configure selectively invalid dependencies to be allowed in `SPECIAL_DEPENDENCIES` below.
 * - `types-only` means we allow any type-only import
 * - `ignore` means we allow any import, as long as the dependency isn't just a dev dependency
 * - `ignore-dev` means we allow any import at all times
 * The `ignore` and `ignore-dev` values are inherently dangerous and may cause broken
 * dependency chains in user projects!
 */
type IgnoreKind = 'types-only' | 'ignore' | 'ignore-dev';

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

const IGNORED_PACKAGES: string[] = [];

const SPECIAL_DEPENDENCIES: Record<string, Record<string, IgnoreKind | void> | void> = {
  'expo-dev-menu': {
    'react-native': 'ignore', // WARN: May need a peer dependency for react-native
  },
  'expo-modules-test-core': {
    typescript: 'ignore-dev', // TODO: Should probably be a peer dep
  },

  '@expo/cli': {
    eslint: 'ignore-dev', // TODO: Switch to resolve-from / project root require
    'expo-constants/package.json': 'ignore-dev', // TODO: Should probably be a peer, but it's both installed in templates and also a dep of expo (needs discussion)
    'metro-runtime/package.json': 'ignore-dev', // NOTE: Only used in developmnt in the expo/expo monorepo
  },

  'expo-router': {
    'expect/build/matchers': 'ignore-dev', // TODO: Unsure how to replace safely. Dep/Peer won't work. Globals and `@jest/globals` unclear
    'expo-font': 'ignore-dev', // TODO: Remove
  },

  '@expo/image-utils': {
    sharp: 'ignore-dev', // TODO: Mark as optional peer dep, if that's the intention
    'sharp-cli': 'ignore-dev',
  },

  '@expo/metro-config': {
    'babel-preset-expo': 'ignore-dev', // TODO: Remove; only used as a fallback for now
  },

  'jest-expo': {
    'babel-preset-expo': 'ignore-dev', // TODO: Remove; only used as a fallback for now
  },

  '@expo/metro-runtime': {
    'expo-constants': 'ignore-dev', // TODO: Should probably be a peer, but it's both installed in templates and also a dep of expo (needs discussion)
  },

  'expo-store-review': {
    'expo-constants': 'ignore-dev', // TODO: Should probably be a peer, but it's both installed in templates and also a dep of expo (needs discussion)
  },

  'babel-preset-expo': {
    '@babel/core': 'types-only',
    '@expo/metro-config/build/babel-transformer': 'types-only',
    'react-native-worklets/plugin': 'ignore-dev', // Checked via hasModule before requiring
    'react-native-reanimated/plugin': 'ignore-dev', // Checked via hasModule before requiring
  },
};

// NOTE: These are globally ignored dependencies, and this list shouldn't ever get longer
const IGNORED_IMPORTS: Record<string, IgnoreKind | void> = {
  'expo-modules-core': 'ignore-dev',
  'expo-asset': 'ignore-dev',

  // This is force-resolved in the CLI and therefore, for Expo modules, is generally safe
  // See: https://github.com/expo/expo/blob/d63143c/packages/%40expo/cli/src/start/server/metro/withMetroMultiPlatform.ts#L603-L622
  '@react-native/assets-registry/registry': 'ignore-dev',
};

/**
 * Checks whether the package has valid dependency chains for each (external) import.
 *
 * @param pkg Package to check
 * @param type What part of the package needs to be checked
 */
export async function checkDependenciesAsync(pkg: Package, type: PackageCheckType = 'package') {
  if (isNCCBuilt(pkg)) {
    return;
  }

  // We still run checks on ignored packages, since we want to ensure disallowed
  // packages are never used
  const isIgnoredPackage = IGNORED_PACKAGES.includes(pkg.packageName);

  const sources = (await getSourceFilesAsync(pkg, type))
    .filter((file) => file.type === 'source')
    .map((file) => ({ file, importRefs: getSourceFileImports(file) }));

  if (!sources.length) {
    return;
  }

  const getValidExternalImportKind = createExternalImportValidator(pkg);
  let invalidImports: {
    file: SourceFile;
    importRef: SourceFileImportRef;
    kind: DependencyKind | undefined;
  }[] = [];

  for (const source of sources) {
    for (const importRef of source.importRefs) {
      if (importRef.type !== 'external' || pkg.packageName === importRef.packageName) {
        continue;
      } else if (isDisallowedImport(importRef)) {
        invalidImports.push({ file: source.file, importRef, kind: undefined });
      } else if (isIgnoredPackage) {
        continue;
      }
      const kind = getValidExternalImportKind(importRef);
      if (!kind || kind === DependencyKind.Dev) {
        invalidImports.push({ file: source.file, importRef, kind });
      }
    }
  }

  const config = SPECIAL_DEPENDENCIES[pkg.packageName];
  // Filter out ignored imports per package
  invalidImports = invalidImports.filter(({ importRef, kind }) => {
    let ignoreKind = config?.[importRef.importValue];
    if (!ignoreKind) {
      // if we can't find an ignore kind for the import, we try just the package name
      const packageName = getPackageName(importRef.importValue);
      ignoreKind = config?.[packageName];
      if (!ignoreKind) {
        // if we still don't find an exception, we see if it's a global exception
        ignoreKind = IGNORED_IMPORTS[importRef.importValue] ?? IGNORED_IMPORTS[packageName];
      }
    }
    switch (ignoreKind) {
      case 'types-only':
        return !importRef.isTypeOnly;
      case 'ignore':
        return kind !== DependencyKind.Dev;
      case 'ignore-dev':
        return false;
      default:
        return true;
    }
  });

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
        `     > ${path.relative(pkg.path, file.path)} - ${importRef.importValue}` +
          `${importRef.isTypeOnly ? ' (types only)' : ''}` +
          `${isDisallowedImport(importRef) ? ' (disallowed)' : ''}`
      );
    });

    if (!importAreTypesOnly) {
      throw new Error(`${pkg.packageName} has invalid dependency chains.`);
    }
  }
}

function isNCCBuilt(pkg: Package): boolean {
  const { build: buildScript } = pkg.packageJson.scripts;
  return !!pkg.packageJson.bin && !!buildScript?.includes('ncc');
}

function isDisallowedImport(ref: SourceFileImportRef): boolean {
  const packageName = getPackageName(ref.packageName);
  return packageName === 'metro' || packageName.startsWith('metro-');
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
  dependencies.forEach((dependency) => dependencyMap.set(dependency.name, dependency));
  return (ref: SourceFileImportRef) => dependencyMap.get(ref.packageName)?.kind;
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

function getPackageName(name: string): string {
  let idx: number;
  if (name[0] === '@') {
    idx = name.indexOf('/');
    return idx > -1 ? name.slice(0, name.indexOf('/', idx + 1)) : name;
  } else {
    idx = name.indexOf('/');
    return idx > -1 ? name.slice(0, idx) : name;
  }
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
    let isTypeOnly = false;
    if (node.importClause?.namedBindings) {
      isTypeOnly =
        node.importClause.isTypeOnly ||
        (ts.isNamedImports(node.importClause.namedBindings) &&
          node.importClause.namedBindings.elements.every((binding) => binding.isTypeOnly));
    } else {
      isTypeOnly = !!node.importClause?.isTypeOnly;
    }
    // Collect `import` statements
    imports.push(createTypescriptImportRef(node.moduleSpecifier.getText(), isTypeOnly));
  } else if (
    ts.isCallExpression(node) &&
    node.expression.getText() === 'require' &&
    node.arguments.every((arg) => ts.isStringLiteral(arg)) // Filter `require(requireFrom(...))
  ) {
    // Collect `require` statement
    imports.push(createTypescriptImportRef(node.arguments[0].getText()));
  } else if (
    ts.isCallExpression(node) &&
    node.expression.getText() === 'require.resolve' &&
    node.arguments.length === 1 && // Filter out `require.resolve('', { paths: ... })`
    ts.isStringLiteral(node.arguments[0]) // Filter `require(requireFrom(...))
  ) {
    // Collect `require.resolve` statement
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
