// @ts-check
import { glob } from 'glob';
import { isBuiltin } from 'node:module';
import ts from 'typescript';

/**
 * @typedef {{ path: string, type: 'source' | 'test' }} SourceFile
 * @typedef {{
 *   type: 'builtIn' | 'internal' | 'external',
 *   importValue: string,
 *   packageName: string,
 *   packagePath?: string,
 *   isTypeOnly?: boolean,
 *   isSideEffect?: boolean,
 *   line?: number,
 * }} SourceFileImportRef
 * @typedef {'package' | 'plugin' | 'cli' | 'utils'} PackageCheckType
 */

const REGEXP_REPLACE_SLASHES = /\\/g;

/**
 * Get a list of all source files to validate for dependency chains.
 * @param {string} packagePath Absolute path to the package root
 * @param {PackageCheckType} type
 * @returns {Promise<SourceFile[]>}
 */
export async function getSourceFilesAsync(packagePath, type) {
  const files = await glob('src/**/*.{ts,tsx,js,jsx}', {
    cwd: getSourceFilePath(packagePath, type),
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

/**
 * Get the path of source files based on the package and the type of check currently running.
 * @param {string} packagePath
 * @param {PackageCheckType} type
 * @returns {string}
 */
function getSourceFilePath(packagePath, type) {
  switch (type) {
    case 'package':
      return packagePath;
    case 'plugin':
    case 'cli':
    case 'utils':
      return `${packagePath}/${type}`;
    default:
      throw new Error(`Unexpected package type received: ${type}`);
  }
}

/**
 * Parse and return all imports from a single source file, using TypeScript AST parsing.
 * @param {SourceFile} sourceFile
 * @returns {SourceFileImportRef[]}
 */
export function getSourceFileImports(sourceFile) {
  /** @type {SourceFileImportRef[]} */
  const importRefs = [];
  const compiler = createTypescriptCompiler();
  const source = compiler.getSourceFile(sourceFile.path, ts.ScriptTarget.Latest, (message) => {
    throw new Error(`Failed to parse ${sourceFile.path}: ${message}`);
  });

  if (source) {
    return collectTypescriptImports(source, source, importRefs);
  }

  return importRefs;
}

/**
 * Iterate the parsed TypeScript AST and collect all imports or require statements.
 * @param {ts.Node} node
 * @param {ts.SourceFile} sourceFile
 * @param {SourceFileImportRef[]} imports
 */
function collectTypescriptImports(node, sourceFile, imports) {
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
    node.arguments.every((arg) => ts.isStringLiteral(arg)) // Filter `require(requireFrom(...))`
  ) {
    const isSideEffect = ts.isExpressionStatement(node.parent);
    const line = ts.getLineAndCharacterOfPosition(sourceFile, node.getStart(sourceFile)).line + 1;
    // Collect `require` statement
    imports.push(createTypescriptImportRef(node.arguments[0].getText(), false, isSideEffect, line));
  } else if (
    ts.isCallExpression(node) &&
    node.expression.getText() === 'require.resolve' &&
    node.arguments.length === 1 && // Filter out `require.resolve('', { paths: ... })`
    ts.isStringLiteral(node.arguments[0]) // Filter `require(requireFrom(...))`
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

/**
 * Analyze the import and return the import ref object.
 * @param {string} importText
 * @param {boolean} [importTypeOnly]
 * @param {boolean} [importSideEffect]
 * @param {number} [line]
 * @returns {SourceFileImportRef}
 */
function createTypescriptImportRef(
  importText,
  importTypeOnly = false,
  importSideEffect = false,
  line
) {
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

/**
 * Return the package name for a (possibly deep) import specifier.
 * @param {string} name
 * @returns {string}
 */
export function getPackageName(name) {
  let idx;
  if (name[0] === '@') {
    idx = name.indexOf('/');
    return idx > -1 ? name.slice(0, name.indexOf('/', idx + 1)) : name;
  } else {
    idx = name.indexOf('/');
    return idx > -1 ? name.slice(0, idx) : name;
  }
}

/** The shared but lazily initialized TypeScript compiler instance. @type {ts.CompilerHost | null} */
let compiler = null;

/** Get or create the TypeScript compiler used to analyze imports for all source files. */
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
 * @param {string} filePath
 * @returns {string}
 */
function toPosixPath(filePath) {
  return filePath.replace(REGEXP_REPLACE_SLASHES, '/');
}

/**
 * Check whether a package is built with ncc (bundled), meaning imports are inlined.
 * @param {import('./check.js').PackageJson} packageJson
 * @returns {boolean}
 */
export function isNCCBuilt(packageJson) {
  const buildScript = packageJson.scripts?.build;
  return !!packageJson.bin && !!buildScript?.includes('ncc');
}
