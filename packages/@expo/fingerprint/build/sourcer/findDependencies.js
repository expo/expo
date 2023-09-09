"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAbsoluteModulePath = exports.findLocalDependenciesFromFileRecursiveAsync = exports.findLocalDependenciesFromFileAsync = exports.findLocalDependencies = exports.findDependencies = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const resolve_from_1 = __importDefault(require("resolve-from"));
const debug = require('debug')('expo:fingerprint:sourcer:Sourcer');
let babelParser;
let babelTraverse;
let babelTypes;
/**
 * Parse the given code and return an array of dependencies.
 */
function findDependencies(projectRoot, code) {
    if (!babelParser || !babelTraverse || !babelTypes) {
        importBabelFromProject(projectRoot);
    }
    const dependencies = new Set();
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
                    }
                    else if (babelTypes.isTemplateLiteral(arg) &&
                        arg.quasis.length === 1 &&
                        arg.quasis[0].value.cooked) {
                        dependencies.add(arg.quasis[0].value.cooked);
                    }
                }
            },
            ImportDeclaration(path) {
                dependencies.add(path.node.source.value);
            },
        });
    }
    catch (e) {
        debug('Error parsing code: %s', e);
    }
    return Array.from(dependencies);
}
exports.findDependencies = findDependencies;
/**
 * Parse the given code and return an array of local dependencies with relative paths to the projectRoot.
 */
function findLocalDependencies(projectRoot, code) {
    return findDependencies(projectRoot, code).filter((dep) => dep.startsWith('.') || dep.startsWith('/'));
}
exports.findLocalDependencies = findLocalDependencies;
/**
 * Parse the given file and return an array of local dependencies.
 */
async function findLocalDependenciesFromFileAsync(projectRoot, modulePath) {
    const filePath = getAbsoluteModulePath(projectRoot, modulePath);
    let contents;
    try {
        contents = await promises_1.default.readFile(filePath, 'utf8');
    }
    catch (e) {
        debug('Error reading file: %s', e);
        throw e;
    }
    if (!contents) {
        return [];
    }
    return findLocalDependencies(projectRoot, contents).map((dep) => path_1.default.relative(projectRoot, getAbsoluteModulePath(projectRoot, dep)));
}
exports.findLocalDependenciesFromFileAsync = findLocalDependenciesFromFileAsync;
/**
 * Parse the given code and return an array of local dependencies with relative paths to the projectRoot.
 * For each dependency, will recursively find transitive dependencies.
 */
async function findLocalDependenciesFromFileRecursiveAsync(projectRoot, modulePath) {
    const results = new Set();
    const deps = await findLocalDependenciesFromFileAsync(projectRoot, modulePath);
    const dir = path_1.default.dirname(modulePath);
    for (const dep of deps) {
        const depFilePath = getAbsoluteModulePath(projectRoot, path_1.default.join(dir, dep));
        results.add(path_1.default.relative(projectRoot, depFilePath));
        const trasitiveDeps = await findLocalDependenciesFromFileRecursiveAsync(projectRoot, depFilePath);
        for (const trasitiveDep of trasitiveDeps) {
            results.add(trasitiveDep);
        }
    }
    return Array.from(results);
}
exports.findLocalDependenciesFromFileRecursiveAsync = findLocalDependenciesFromFileRecursiveAsync;
/**
 * Import necessary babel dependencies from the project.
 */
function importBabelFromProject(projectRoot) {
    try {
        babelParser = require((0, resolve_from_1.default)(projectRoot, '@babel/parser'));
        babelTraverse = require((0, resolve_from_1.default)(projectRoot, '@babel/traverse')).default;
        babelTypes = require((0, resolve_from_1.default)(projectRoot, '@babel/types'));
    }
    catch (e) {
        debug('Error importing babel', e);
        throw new Error('Unable to import `@babel/parser`, `@babel/traverse`, and `@babel/types` from the project. Please ensure that you have these dependencies installed.');
    }
}
/**
 * Get the absolute file path from the given module path.
 */
function getAbsoluteModulePath(projectRoot, modulePath) {
    let filePath = modulePath;
    if (!path_1.default.extname(path_1.default.basename(filePath))) {
        filePath += '.js';
    }
    return path_1.default.resolve(projectRoot, filePath);
}
exports.getAbsoluteModulePath = getAbsoluteModulePath;
//# sourceMappingURL=findDependencies.js.map