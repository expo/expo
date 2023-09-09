import fs from 'fs/promises';
import path from 'path';
import resolveFrom from 'resolve-from';

const debug = require('debug')('expo:fingerprint:sourcer:Sourcer');

let babelParser: typeof import('@babel/parser');
let babelTraverse: typeof import('@babel/traverse').default;
let babelTypes: typeof import('@babel/types');

/**
 * Parse the given code and return an array of dependencies.
 */
export function findDependencies(projectRoot: string, code: string): string[] {
  if (!babelParser || !babelTraverse || !babelTypes) {
    importBabelFromProject(projectRoot);
  }
  const dependencies = new Set<string>();

  try {
    const ast = babelParser.parse(code, {
      sourceType: 'module',
    });
    babelTraverse(ast, {
      CallExpression(path) {
        if (babelTypes.isIdentifier(path.node.callee, { name: 'require' })) {
          const arg = path.node.arguments[0];
          if (babelTypes.isStringLiteral(arg)) {
            dependencies.add(arg.value);
          } else if (
            babelTypes.isTemplateLiteral(arg) &&
            arg.quasis.length === 1 &&
            arg.quasis[0].value.cooked
          ) {
            dependencies.add(arg.quasis[0].value.cooked);
          }
        }
      },
      ImportDeclaration(path) {
        dependencies.add(path.node.source.value);
      },
    });
  } catch (e: unknown) {
    debug('Error parsing code: %s', e);
  }

  return Array.from(dependencies);
}

/**
 * Parse the given code and return an array of local dependencies with relative paths to the projectRoot.
 */
export function findLocalDependencies(projectRoot: string, code: string): string[] {
  return findDependencies(projectRoot, code).filter(
    (dep) => dep.startsWith('.') || dep.startsWith('/')
  );
}

/**
 * Parse the given file and return an array of local dependencies.
 */
export async function findLocalDependenciesFromFileAsync(
  projectRoot: string,
  modulePath: string
): Promise<string[]> {
  const filePath = getAbsoluteModulePath(projectRoot, modulePath);
  let contents;
  try {
    contents = await fs.readFile(filePath, 'utf8');
  } catch (e: unknown) {
    debug('Error reading file: %s', e);
    throw e;
  }

  if (!contents) {
    return [];
  }
  return findLocalDependencies(projectRoot, contents).map((dep) =>
    path.relative(projectRoot, getAbsoluteModulePath(projectRoot, dep))
  );
}

/**
 * Parse the given code and return an array of local dependencies with relative paths to the projectRoot.
 * For each dependency, will recursively find transitive dependencies.
 */
export async function findLocalDependenciesFromFileRecursiveAsync(
  projectRoot: string,
  modulePath: string
): Promise<string[]> {
  const results = new Set<string>();
  const deps = await findLocalDependenciesFromFileAsync(projectRoot, modulePath);
  const dir = path.dirname(modulePath);
  for (const dep of deps) {
    const depFilePath = getAbsoluteModulePath(projectRoot, path.join(dir, dep));
    results.add(path.relative(projectRoot, depFilePath));
    const trasitiveDeps = await findLocalDependenciesFromFileRecursiveAsync(
      projectRoot,
      depFilePath
    );
    for (const trasitiveDep of trasitiveDeps) {
      results.add(trasitiveDep);
    }
  }
  return Array.from(results);
}

/**
 * Import necessary babel dependencies from the project.
 */
function importBabelFromProject(projectRoot: string) {
  try {
    babelParser = require(resolveFrom(projectRoot, '@babel/parser'));
    babelTraverse = require(resolveFrom(projectRoot, '@babel/traverse')).default;
    babelTypes = require(resolveFrom(projectRoot, '@babel/types'));
  } catch (e: unknown) {
    debug('Error importing babel', e);
    throw new Error(
      'Unable to import `@babel/parser`, `@babel/traverse`, and `@babel/types` from the project. Please ensure that you have these dependencies installed.'
    );
  }
}

/**
 * Get the absolute file path from the given module path.
 */
export function getAbsoluteModulePath(projectRoot: string, modulePath: string) {
  let filePath = modulePath;
  if (!path.extname(path.basename(filePath))) {
    filePath += '.js';
  }
  return path.resolve(projectRoot, filePath);
}
