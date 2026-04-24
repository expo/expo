import { glob } from 'glob';
import { isBuiltin } from 'node:module';
import path from 'node:path';
import ts from 'typescript';

import { DependencyKind, type PackageDependency, type Package } from '../Packages';

type PackageCheckType = 'package' | 'plugin' | 'cli' | 'utils';

export type SourceFile = {
  path: string;
  type: 'source' | 'test';
};

export type SourceFileImportRef = {
  type: 'builtIn' | 'internal' | 'external';
  importValue: string;
  packageName: string;
  packagePath?: string;
  isTypeOnly?: boolean;
  isSideEffect?: boolean;
  /** 1-based line number in the source file where this import appears */
  line?: number;
};

export type FileRef = {
  /** Path relative to the package root */
  relativePath: string;
  /** 1-based line number of the first import of this dependency in the file */
  line: number;
};

export type ScannedDependency = {
  packageName: string;
  isTypeOnly: boolean;
  isSideEffect: boolean;
  /** The dependency kind from package.json, or undefined if undeclared */
  kind: DependencyKind | undefined;
  /** One entry per file, deduplicated, showing the first import line */
  files: FileRef[];
};

const REGEXP_REPLACE_SLASHES = /\\/g;

/**
 * Scans source files of a package and returns all external dependencies found via imports.
 * This resolves each import against the package's declared dependencies.
 */
export async function scanDependenciesAsync(
  pkg: Package,
  type: PackageCheckType = 'package'
): Promise<ScannedDependency[]> {
  const sources = (await getSourceFilesAsync(pkg, type))
    .filter((file) => file.type === 'source')
    .map((file) => ({ file, importRefs: getSourceFileImports(file) }));

  if (!sources.length) {
    return [];
  }

  const dependencies = pkg.getDependencies([
    DependencyKind.Normal,
    DependencyKind.Dev,
    DependencyKind.Peer,
  ]);
  const dependencyMap = new Map<string, PackageDependency>();
  dependencies.forEach((dep) => dependencyMap.set(dep.name, dep));

  // Aggregate imports by package name, tracking one line per file (the earliest)
  const aggregated = new Map<
    string,
    { isTypeOnly: boolean; isSideEffect: boolean; fileLines: Map<string, number> }
  >();

  for (const source of sources) {
    for (const ref of source.importRefs) {
      if (ref.type !== 'external' || pkg.packageName === ref.packageName) {
        continue;
      }

      let entry = aggregated.get(ref.packageName);
      if (!entry) {
        entry = { isTypeOnly: true, isSideEffect: true, fileLines: new Map() };
        aggregated.set(ref.packageName, entry);
      }

      const refLine = ref.line ?? 1;
      const existing = entry.fileLines.get(source.file.path);
      if (existing === undefined || refLine < existing) {
        entry.fileLines.set(source.file.path, refLine);
      }
      if (!ref.isTypeOnly) {
        entry.isTypeOnly = false;
      }
      if (!ref.isSideEffect) {
        entry.isSideEffect = false;
      }
    }
  }

  const results: ScannedDependency[] = [];
  for (const [packageName, entry] of aggregated) {
    results.push({
      packageName,
      isTypeOnly: entry.isTypeOnly,
      isSideEffect: entry.isSideEffect,
      kind: dependencyMap.get(packageName)?.kind,
      files: [...entry.fileLines.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([filePath, line]) => ({
          relativePath: path.relative(pkg.path, filePath),
          line,
        })),
    });
  }

  results.sort((a, b) => a.packageName.localeCompare(b.packageName));
  return results;
}

/** Get a list of all source files to validate for dependency chains */
export async function getSourceFilesAsync(
  pkg: Package,
  type: PackageCheckType
): Promise<SourceFile[]> {
  const files = await glob('src/**/*.{ts,tsx,js,jsx}', {
    cwd: getSourceFilePaths(pkg, type),
    absolute: true,
    nodir: true,
  });

  return files
    .filter((filePath) => !filePath.endsWith('.d.ts'))
    .map((filePath) => toPosixPath(filePath))
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

/** Parse and return all imports from a single source file, using TypeScript AST parsing */
export function getSourceFileImports(sourceFile: SourceFile): SourceFileImportRef[] {
  const importRefs: SourceFileImportRef[] = [];
  const compiler = createTypescriptCompiler();
  const source = compiler.getSourceFile(sourceFile.path, ts.ScriptTarget.Latest, (message) => {
    throw new Error(`Failed to parse ${sourceFile.path}: ${message}`);
  });

  if (source) {
    return collectTypescriptImports(source, source, importRefs);
  }

  return importRefs;
}

/** Iterate the parsed TypeScript AST and collect all imports or require statements */
function collectTypescriptImports(
  node: ts.Node,
  sourceFile: ts.SourceFile,
  imports: SourceFileImportRef[]
) {
  if (ts.isImportDeclaration(node)) {
    const isSideEffect = !node.importClause;
    let isTypeOnly = false;
    if (node.importClause?.namedBindings) {
      isTypeOnly =
        node.importClause.isTypeOnly ||
        (ts.isNamedImports(node.importClause.namedBindings) &&
          node.importClause.namedBindings.elements.every((binding) => binding.isTypeOnly));
    } else {
      isTypeOnly = !!node.importClause?.isTypeOnly;
    }
    const line = ts.getLineAndCharacterOfPosition(sourceFile, node.getStart(sourceFile)).line + 1;
    // Collect `import` statements
    imports.push(
      createTypescriptImportRef(node.moduleSpecifier.getText(), isTypeOnly, isSideEffect, line)
    );
  } else if (
    ts.isCallExpression(node) &&
    node.expression.getText() === 'require' &&
    node.arguments.every((arg) => ts.isStringLiteral(arg)) // Filter `require(requireFrom(...))
  ) {
    const isSideEffect = ts.isExpressionStatement(node.parent);
    const line = ts.getLineAndCharacterOfPosition(sourceFile, node.getStart(sourceFile)).line + 1;
    // Collect `require` statement
    imports.push(createTypescriptImportRef(node.arguments[0].getText(), false, isSideEffect, line));
  } else if (
    ts.isCallExpression(node) &&
    node.expression.getText() === 'require.resolve' &&
    node.arguments.length === 1 && // Filter out `require.resolve('', { paths: ... })`
    ts.isStringLiteral(node.arguments[0]) // Filter `require(requireFrom(...))
  ) {
    const line = ts.getLineAndCharacterOfPosition(sourceFile, node.getStart(sourceFile)).line + 1;
    // Collect `require.resolve` statement
    imports.push(createTypescriptImportRef(node.arguments[0].getText(), false, false, line));
  } else if (
    ts.isImportTypeNode(node) &&
    ts.isLiteralTypeNode(node.argument) &&
    ts.isStringLiteral(node.argument.literal)
  ) {
    const line = ts.getLineAndCharacterOfPosition(sourceFile, node.getStart(sourceFile)).line + 1;
    // Collect `typeof import('...')` and `import('...')` in type positions
    imports.push(createTypescriptImportRef(node.argument.literal.getText(), true, false, line));
  } else {
    ts.forEachChild(node, (child) => {
      collectTypescriptImports(child, sourceFile, imports);
    });
  }

  return imports;
}

/** Analyze the import and return the import ref object */
function createTypescriptImportRef(
  importText: string,
  importTypeOnly = false,
  importSideEffect = false,
  line?: number
): SourceFileImportRef {
  const importValue = importText.replace(/['"]/g, '').trim();

  if (isBuiltin(importValue)) {
    return {
      type: 'builtIn',
      importValue,
      packageName: importValue,
      isTypeOnly: importTypeOnly,
      isSideEffect: importSideEffect,
      line,
    };
  }

  if (importValue.startsWith('.')) {
    return {
      type: 'internal',
      importValue,
      packageName: importValue,
      isTypeOnly: importTypeOnly,
      isSideEffect: importSideEffect,
      line,
    };
  }

  if (importValue.startsWith('@')) {
    const [packageScope, packageName, ...packagePath] = importValue.split('/');
    return {
      type: 'external',
      importValue,
      packageName: `${packageScope}/${packageName}`,
      packagePath: packagePath.join('/'),
      isTypeOnly: importTypeOnly,
      isSideEffect: importSideEffect,
      line,
    };
  }

  const [packageName, ...packagePath] = importValue.split('/');
  return {
    type: 'external',
    importValue,
    packageName,
    packagePath: packagePath.join(','),
    isTypeOnly: importTypeOnly,
    isSideEffect: importSideEffect,
    line,
  };
}

export function getPackageName(name: string): string {
  let idx: number;
  if (name[0] === '@') {
    idx = name.indexOf('/');
    return idx > -1 ? name.slice(0, name.indexOf('/', idx + 1)) : name;
  } else {
    idx = name.indexOf('/');
    return idx > -1 ? name.slice(0, idx) : name;
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

/**
 * Convert any platform-specific path to a POSIX path.
 */
function toPosixPath(filePath: string): string {
  return filePath.replace(REGEXP_REPLACE_SLASHES, '/');
}

/**
 * Check whether a package is built with ncc (bundled), meaning imports are inlined.
 */
export function isNCCBuilt(pkg: Package): boolean {
  const { build: buildScript } = pkg.packageJson.scripts;
  return !!pkg.packageJson.bin && !!buildScript?.includes('ncc');
}
