"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Codemod: Replace @react-navigation/* imports with expo-router equivalents.
 *
 * Mapping:
 *   @react-navigation/native        → expo-router
 *   @react-navigation/stack         → expo-router/js-stack
 *   @react-navigation/bottom-tabs   → expo-router/js-tabs
 *   @react-navigation/material-top-tabs → expo-router/js-top-tabs
 *
 * Unsupported (no direct equivalent — throws to surface the migration step):
 *   @react-navigation/native-stack  → use the `Stack` layout from expo-router
 *   @react-navigation/drawer        → use the `Drawer` layout from expo-router
 *
 * After replacement, duplicate `expo-router` imports are merged into one.
 */
const chalk_1 = __importDefault(require("chalk"));
const IMPORT_MAP = {
    '@react-navigation/native': 'expo-router/react-navigation',
    '@react-navigation/elements': 'expo-router/react-navigation',
    '@react-navigation/core': 'expo-router/react-navigation',
    '@react-navigation/routers': 'expo-router/react-navigation',
    '@react-navigation/stack': 'expo-router/js-stack',
    '@react-navigation/bottom-tabs': 'expo-router/js-tabs',
    '@react-navigation/material-top-tabs': 'expo-router/js-top-tabs',
};
const UNSUPPORTED_PACKAGES = {
    '@react-navigation/native-stack': 'Use the `Stack` layout (https://docs.expo.dev/router/advanced/stack/) instead',
    '@react-navigation/drawer': 'Use the `Drawer` layout (https://docs.expo.dev/router/advanced/drawer/) instead',
};
const UNSUPPORTED_SPECIFIERS = {
    ImportDefaultSpecifier: 'default import',
    ImportNamespaceSpecifier: 'namespace import (import * as ...)',
};
// Prints a prominent, color-formatted error block to stderr.
const printErrorBlock = (title, lines) => {
    const divider = chalk_1.default.red.bold('━'.repeat(78));
    const heading = chalk_1.default.red.bold(`  ${title}`);
    const body = lines.map((line) => chalk_1.default.red(`  ${line}`));
    console.error(['', divider, heading, divider, '', ...body, ''].join('\n'));
};
const isTypeOnlyImport = (path) => path.node.importKind === 'type';
/**
 * Clone the specifier, changing its importKind to be type, for example:
 * import { type A } from "b"
 */
const markAsInlineType = (spec) => {
    const clone = { ...spec };
    clone.importKind = 'type';
    return clone;
};
/**
 * Collects errors for imports from packages that have no direct expo-router
 * equivalent (e.g. `@react-navigation/native-stack`, `@react-navigation/drawer`).
 * These require a structural migration to the file-based `Stack`/`Drawer`
 * layouts and cannot be rewritten automatically.
 */
const collectUnsupportedPackageErrors = (filePath, paths) => {
    const errors = [];
    for (const declarationPath of paths) {
        const sourceModule = declarationPath.node.source.value;
        const message = UNSUPPORTED_PACKAGES[sourceModule];
        if (!message)
            continue;
        const line = declarationPath.node.loc?.start.line ?? '?';
        errors.push(`${filePath}:${line} - import from "${sourceModule}" cannot be migrated. ${message}`);
    }
    return errors;
};
/**
 * Collects errors for unsupported import styles in the given declarations:
 * default imports (`import A from "b"`) and namespace imports
 * (`import * as A from "b"`). Only named imports (`import { A } from "b"`)
 * can be safely rewritten.
 */
const collectUnsupportedImportStyleErrors = (filePath, paths) => {
    const errors = [];
    for (const declarationPath of paths) {
        const specifiers = (declarationPath.node.specifiers ?? []);
        for (const spec of specifiers) {
            const label = UNSUPPORTED_SPECIFIERS[spec.type];
            if (!label)
                continue;
            const line = declarationPath.node.loc?.start.line ?? '?';
            const sourceModule = declarationPath.node.source.value;
            errors.push([
                `${filePath}:${line} - ${label} from "${sourceModule}" is not supported.`,
                'Only named imports can be rewritten by this codemod.',
                'Replace this import with named imports and re-run the codemod.',
            ].join('\n'));
        }
    }
    return errors;
};
const groupPathsBySource = (paths) => {
    const groupsBySource = new Map();
    for (const declarationPath of paths) {
        const sourceModule = declarationPath.node.source.value;
        const existing = groupsBySource.get(sourceModule);
        if (existing) {
            existing.push(declarationPath);
        }
        else {
            groupsBySource.set(sourceModule, [declarationPath]);
        }
    }
    return groupsBySource;
};
const mergeGroup = (j, groupPaths) => {
    const hasAnyTypeOnlyImport = groupPaths.some(isTypeOnlyImport);
    const allImportsAreTypeOnly = groupPaths.every(isTypeOnlyImport);
    // Mixed: `import type { A }` + `import { B }` → `import { type A, B }`.
    const mixesTypeAndValueImports = hasAnyTypeOnlyImport && !allImportsAreTypeOnly;
    const [mergeTarget, ...declarationsToRemove] = groupPaths;
    if (!mergeTarget)
        return;
    const specifiers = groupPaths.flatMap((declarationPath) => {
        const specs = (declarationPath.node.specifiers ?? []);
        return mixesTypeAndValueImports && isTypeOnlyImport(declarationPath)
            ? specs.map(markAsInlineType)
            : specs;
    });
    j(mergeTarget).replaceWith(j.importDeclaration(specifiers, mergeTarget.node.source, allImportsAreTypeOnly ? 'type' : 'value'));
    for (const declarationPath of declarationsToRemove)
        j(declarationPath).remove();
};
const transform = (fileInfo, api) => {
    const j = api.jscodeshift;
    const root = j(fileInfo.source);
    const unsupportedPackagePaths = root
        .find(j.ImportDeclaration)
        .filter((path) => path.node.source.value in UNSUPPORTED_PACKAGES)
        .paths();
    const unsupportedPackageErrors = collectUnsupportedPackageErrors(fileInfo.path, unsupportedPackagePaths);
    if (unsupportedPackageErrors.length) {
        printErrorBlock('Migration required — manual change needed', unsupportedPackageErrors);
    }
    const mappablePaths = root
        .find(j.ImportDeclaration)
        .filter((path) => path.node.source.value in IMPORT_MAP)
        .paths();
    if (mappablePaths.length === 0)
        return undefined;
    const errors = collectUnsupportedImportStyleErrors(fileInfo.path, mappablePaths);
    if (errors.length) {
        printErrorBlock('Unsupported import style — manual change needed', errors);
    }
    if (unsupportedPackageErrors.length || errors.length) {
        return undefined;
    }
    for (const path of mappablePaths) {
        const sourceModule = path.node.source.value;
        path.node.source.value = IMPORT_MAP[sourceModule];
    }
    const groups = groupPathsBySource(root.find(j.ImportDeclaration).paths());
    for (const [importPath, groupPaths] of groups.entries()) {
        if (groupPaths.length > 1 && importPath.startsWith('expo-router')) {
            mergeGroup(j, groupPaths);
        }
    }
    return root.toSource();
};
exports.default = transform;
//# sourceMappingURL=sdk-56-expo-router-react-navigation-replace.js.map