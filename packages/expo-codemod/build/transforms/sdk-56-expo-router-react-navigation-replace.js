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
 * Rewritten site types: named imports and named re-exports
 * (`export { A } from '...'`).
 *
 * `jest.mock(...)`/`jest.requireActual(...)` calls are reported but never
 * rewritten — see the note on JEST_MODULE_METHODS below. Inline `import("...")`
 * types are reported the same way — see the note on findTypeImportPaths.
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
const getDeclarationSite = (path, kind) => ({
    sourceModule: path.node.source?.value,
    line: path.node.loc?.start.line ?? '?',
    kind,
});
/**
 * Collects errors for sites referencing packages that have no direct
 * expo-router equivalent (e.g. `@react-navigation/native-stack`,
 * `@react-navigation/drawer`). These require a structural migration to the
 * file-based `Stack`/`Drawer` layouts and cannot be rewritten automatically.
 */
const collectUnsupportedPackageErrors = (filePath, sites) => {
    const errors = [];
    for (const site of sites) {
        const message = UNSUPPORTED_PACKAGES[site.sourceModule];
        if (!message)
            continue;
        errors.push(`${filePath}:${site.line} - ${site.kind} from "${site.sourceModule}" cannot be migrated. ${message}`);
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
// `expo-router/react-navigation` bundles its own implementation rather than
// re-exporting `@react-navigation/*`, so jest module mocks need manual review.
const JEST_MODULE_METHODS = new Set([
    'mock',
    'doMock',
    'unmock',
    'setMock',
    'requireActual',
    'requireMock',
    'createMockFromModule',
]);
const findJestModuleCalls = (j, root) => root
    .find(j.CallExpression)
    .filter((path) => {
    const { callee } = path.node;
    if (callee.type !== 'MemberExpression' ||
        callee.object.type !== 'Identifier' ||
        callee.object.name !== 'jest' ||
        callee.property.type !== 'Identifier' ||
        !JEST_MODULE_METHODS.has(callee.property.name)) {
        return false;
    }
    const [firstArg] = path.node.arguments;
    return (firstArg != null &&
        (firstArg.type === 'StringLiteral' || firstArg.type === 'Literal') &&
        typeof firstArg.value === 'string');
})
    .paths();
const getCallSite = (path) => ({
    sourceModule: path.node.arguments[0].value,
    line: path.node.loc?.start.line ?? '?',
    kind: 'call',
});
// Inline `import("...")` types — `let a: import('@react-navigation/native').NavigationProp`
// — reference a module the same way an import declaration does, but they are
// reported rather than rewritten: the codemod only rewrites declarations, and an
// inline type is better replaced by an `import type { ... } from` declaration,
// which this transform then migrates on the next run.
//
// Note that ast-types does not descend into the type arguments of a call
// expression, so an `import("...")` inside `jest.mock<typeof import("...")>(...)`
// or `foo<import("...")>()` is not visited here. The jest form is already
// reported through the call itself.
const findTypeImportPaths = (j, root) => root
    .find(j.TSImportType)
    .filter((path) => typeof path.node.argument?.value === 'string')
    .paths();
const getTypeImportSite = (path) => ({
    sourceModule: path.node.argument.value,
    line: path.node.loc?.start.line ?? '?',
    kind: 'type',
});
// Re-export styles that carry a module specifier but cannot be rewritten:
//
//   export * as ns from '...'    — namespace, same reason `import * as` is unsupported
//   export v from '...'          — export-default-from, same reason a default import is
//   export { default as X } from '...'  — re-exports the source module's default export
//
// The `ts`/`tsx` parsers give the first two an `ExportNamedDeclaration` with a
// single specifier, so they reach the same list as named re-exports and would
// otherwise be skipped silently. (The `jsx` parser instead reports
// `export * as ns from` as an `ExportAllDeclaration`, which the `export *` loop
// covers, and rejects `export v from` outright.) The third parses as an
// ordinary `ExportSpecifier`, so it is recognised by the name it re-exports,
// either as an identifier or as a string literal (`export { "default" as X }`).
const unsupportedReExportLabel = (spec) => {
    if (spec.type === 'ExportNamespaceSpecifier') {
        return 'namespace re-export (export * as ns from ...)';
    }
    if (spec.type === 'ExportDefaultSpecifier') {
        return 'default re-export (export v from ...)';
    }
    if (spec.type === 'ExportSpecifier' &&
        (spec.local?.name === 'default' || spec.local?.value === 'default')) {
        return 'default re-export (export { default as X } from ...)';
    }
    return undefined;
};
// `export { A } from '...'` can be rewritten exactly like a named import. Any
// specifier the list above rejects makes the whole declaration unrewritable,
// the same way one default specifier disqualifies an import declaration.
const isNamedReExport = (path) => path.node.source != null &&
    (path.node.specifiers ?? []).every((spec) => spec.type === 'ExportSpecifier' && unsupportedReExportLabel(spec) == null);
const transform = (fileInfo, api) => {
    const j = api.jscodeshift;
    const root = j(fileInfo.source);
    const importPaths = root.find(j.ImportDeclaration).paths();
    const reExportPaths = root
        .find(j.ExportNamedDeclaration)
        .filter((path) => path.node.source != null)
        .paths();
    const exportAllPaths = root.find(j.ExportAllDeclaration).paths();
    const jestCallPaths = findJestModuleCalls(j, root);
    const typeImportPaths = findTypeImportPaths(j, root);
    const allSites = [
        ...importPaths.map((path) => getDeclarationSite(path, 'import')),
        ...reExportPaths.map((path) => getDeclarationSite(path, 'export')),
        ...exportAllPaths.map((path) => getDeclarationSite(path, 'export')),
        ...jestCallPaths.map(getCallSite),
        ...typeImportPaths.map(getTypeImportSite),
    ];
    const unsupportedPackageErrors = collectUnsupportedPackageErrors(fileInfo.path, allSites);
    if (unsupportedPackageErrors.length) {
        printErrorBlock('Migration required — manual change needed', unsupportedPackageErrors);
    }
    if (!allSites.some((site) => site.sourceModule in IMPORT_MAP))
        return undefined;
    const mappablePaths = importPaths.filter((path) => path.node.source.value in IMPORT_MAP);
    const errors = collectUnsupportedImportStyleErrors(fileInfo.path, mappablePaths);
    // `export * from '...'` re-exports the source module's full namespace, which
    // may not match the expo-router entry point shape — same reason namespace
    // imports are unsupported.
    for (const path of exportAllPaths) {
        const sourceModule = path.node.source.value;
        if (!(sourceModule in IMPORT_MAP))
            continue;
        errors.push([
            `${fileInfo.path}:${path.node.loc?.start.line ?? '?'} - namespace re-export (export * from "${sourceModule}") is not supported.`,
            'Only named imports and named re-exports can be rewritten by this codemod.',
            'Replace it with named re-exports and re-run the codemod.',
        ].join('\n'));
    }
    // Re-exports that land in `reExportPaths` but cannot be rewritten — see
    // `unsupportedReExportLabel`. Report them rather than skipping them silently.
    for (const path of reExportPaths) {
        const sourceModule = path.node.source?.value;
        if (!(sourceModule in IMPORT_MAP) || isNamedReExport(path))
            continue;
        for (const spec of path.node.specifiers ?? []) {
            const label = unsupportedReExportLabel(spec);
            if (!label)
                continue;
            errors.push([
                `${fileInfo.path}:${path.node.loc?.start.line ?? '?'} - ${label} from "${sourceModule}" is not supported.`,
                'Only named imports and named re-exports can be rewritten by this codemod.',
                'Replace it with named re-exports and re-run the codemod.',
            ].join('\n'));
        }
    }
    // Inline `import("...")` types. See `findTypeImportPaths`.
    for (const path of typeImportPaths) {
        const sourceModule = path.node.argument.value;
        if (!(sourceModule in IMPORT_MAP))
            continue;
        errors.push([
            `${fileInfo.path}:${path.node.loc?.start.line ?? '?'} - inline type import (import("${sourceModule}")) is not supported.`,
            'Only named imports and named re-exports can be rewritten by this codemod.',
            'Replace it with an `import type { ... } from` declaration and re-run the codemod.',
        ].join('\n'));
    }
    if (errors.length) {
        printErrorBlock('Unsupported import style — manual change needed', errors);
    }
    // Jest module calls are reported, never rewritten. See JEST_MODULE_METHODS.
    const jestWarnings = jestCallPaths
        .filter((path) => path.node.arguments[0].value in IMPORT_MAP)
        .map((path) => {
        const sourceModule = path.node.arguments[0].value;
        const method = path.node.callee.property.name;
        return [
            `${fileInfo.path}:${path.node.loc?.start.line ?? '?'} - jest.${method}("${sourceModule}") was left unchanged.`,
            `"${IMPORT_MAP[sourceModule]}" is expo-router's own bundled copy of React`,
            `Navigation, not a re-export of "${sourceModule}", so this mock no longer applies`,
            'to the imports migrated in this file. Point it at the expo-router module by hand',
            'if the test still needs a mock.',
        ].join('\n');
    });
    if (jestWarnings.length) {
        printErrorBlock('Jest module mocks — manual review needed', jestWarnings);
    }
    // Rewrite supported imports even when other imports need manual migration.
    let didRewrite = false;
    const rewrittenImportSources = new Set();
    for (const path of mappablePaths) {
        const specifiers = (path.node.specifiers ?? []);
        // Skip imports we cannot safely rewrite (default/namespace style). These are
        // reported above and left untouched for the user to migrate manually.
        if (specifiers.some((spec) => UNSUPPORTED_SPECIFIERS[spec.type] != null)) {
            continue;
        }
        const sourceModule = path.node.source.value;
        const targetModule = IMPORT_MAP[sourceModule];
        path.node.source.value = targetModule;
        rewrittenImportSources.add(targetModule);
        didRewrite = true;
    }
    for (const path of reExportPaths) {
        const source = path.node.source;
        if (source == null)
            continue;
        const sourceModule = source.value;
        if (!(sourceModule in IMPORT_MAP) || !isNamedReExport(path))
            continue;
        source.value = IMPORT_MAP[sourceModule];
        didRewrite = true;
    }
    if (!didRewrite) {
        return undefined;
    }
    const groups = groupPathsBySource(root.find(j.ImportDeclaration).paths());
    for (const [importPath, groupPaths] of groups.entries()) {
        if (groupPaths.length > 1 && rewrittenImportSources.has(importPath)) {
            mergeGroup(j, groupPaths);
        }
    }
    return root.toSource();
};
exports.default = transform;
//# sourceMappingURL=sdk-56-expo-router-react-navigation-replace.js.map