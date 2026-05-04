/**
 * Codemod: Replace @react-navigation/* imports with expo-router equivalents.
 *
 * Mapping:
 *   @react-navigation/native        → expo-router
 *   @react-navigation/stack         → expo-router/js-stack
 *   @react-navigation/bottom-tabs   → expo-router/js-tabs
 *   @react-navigation/material-top-tabs → expo-router/js-top-tabs
 *
 * After replacement, duplicate `expo-router` imports are merged into one.
 */
import type {
  ASTPath,
  ImportDeclaration,
  ImportDefaultSpecifier,
  ImportNamespaceSpecifier,
  ImportSpecifier,
  JSCodeshift,
  Transform,
} from 'jscodeshift';

// Specifier types in `@types/jscodeshift` (via ast-types) don't expose the
// inline `type` modifier (`import { type A }`), even though Babel emits it as
// `importKind` on each specifier at runtime.
type ImportSpecifierWithKind = (
  | ImportSpecifier
  | ImportDefaultSpecifier
  | ImportNamespaceSpecifier
) & { importKind?: 'type' | 'value' };

const IMPORT_MAP: Record<string, string> = {
  '@react-navigation/native': 'expo-router/react-navigation',
  '@react-navigation/elements': 'expo-router/react-navigation',
  '@react-navigation/core': 'expo-router/react-navigation',
  '@react-navigation/routers': 'expo-router/react-navigation',
  '@react-navigation/stack': 'expo-router/js-stack',
  '@react-navigation/bottom-tabs': 'expo-router/js-tabs',
  '@react-navigation/material-top-tabs': 'expo-router/js-top-tabs',
};

const UNSUPPORTED_SPECIFIERS: Partial<Record<ImportSpecifierWithKind['type'], string>> = {
  ImportDefaultSpecifier: 'default import',
  ImportNamespaceSpecifier: 'namespace import (import * as ...)',
};

const isTypeOnlyImport = (path: ASTPath<ImportDeclaration>): boolean =>
  path.node.importKind === 'type';

/**
 * Clone the specifier, changing its importKind to be type, for example:
 * import { type A } from "b"
 */
const markAsInlineType = <T extends ImportSpecifierWithKind>(spec: T): T => {
  const clone = { ...spec };
  clone.importKind = 'type';
  return clone;
};

/**
 * Collects errors for unsupported import styles in the given declarations:
 * default imports (`import A from "b"`) and namespace imports
 * (`import * as A from "b"`). Only named imports (`import { A } from "b"`)
 * can be safely rewritten.
 */
const collectUnsupportedImportStyleErrors = (
  filePath: string,
  paths: ASTPath<ImportDeclaration>[]
): string[] => {
  const errors: string[] = [];
  for (const declarationPath of paths) {
    const specifiers = (declarationPath.node.specifiers ?? []) as ImportSpecifierWithKind[];
    for (const spec of specifiers) {
      const label = UNSUPPORTED_SPECIFIERS[spec.type];
      if (!label) continue;
      const line = declarationPath.node.loc?.start.line ?? '?';
      const sourceModule = declarationPath.node.source.value as string;
      errors.push(
        `${filePath}:${line} - ${label} from "${sourceModule}" is not supported. ` +
          `Replace with named imports before running this codemod.`
      );
    }
  }
  return errors;
};

const groupPathsBySource = (
  paths: ASTPath<ImportDeclaration>[]
): Map<string, ASTPath<ImportDeclaration>[]> => {
  const groupsBySource = new Map<string, ASTPath<ImportDeclaration>[]>();
  for (const declarationPath of paths) {
    const sourceModule = declarationPath.node.source.value as string;
    const existing = groupsBySource.get(sourceModule);
    if (existing) {
      existing.push(declarationPath);
    } else {
      groupsBySource.set(sourceModule, [declarationPath]);
    }
  }
  return groupsBySource;
};

const mergeGroup = (j: JSCodeshift, groupPaths: ASTPath<ImportDeclaration>[]): void => {
  const hasAnyTypeOnlyImport = groupPaths.some(isTypeOnlyImport);
  const allImportsAreTypeOnly = groupPaths.every(isTypeOnlyImport);
  // Mixed: `import type { A }` + `import { B }` → `import { type A, B }`.
  const mixesTypeAndValueImports = hasAnyTypeOnlyImport && !allImportsAreTypeOnly;

  const [mergeTarget, ...declarationsToRemove] = groupPaths;
  if (!mergeTarget) return;

  const specifiers = groupPaths.flatMap((declarationPath) => {
    const specs = (declarationPath.node.specifiers ?? []) as ImportSpecifierWithKind[];
    return mixesTypeAndValueImports && isTypeOnlyImport(declarationPath)
      ? specs.map(markAsInlineType)
      : specs;
  });

  j(mergeTarget).replaceWith(
    j.importDeclaration(
      specifiers,
      mergeTarget.node.source,
      allImportsAreTypeOnly ? 'type' : 'value'
    )
  );

  for (const declarationPath of declarationsToRemove) j(declarationPath).remove();
};

const transform: Transform = (fileInfo, api) => {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  const mappablePaths = root
    .find(j.ImportDeclaration)
    .filter((path) => (path.node.source.value as string) in IMPORT_MAP)
    .paths();

  if (mappablePaths.length === 0) return undefined;

  const errors = collectUnsupportedImportStyleErrors(fileInfo.path, mappablePaths);
  if (errors.length > 0) {
    throw new Error(`Unsupported import style(s) found:\n${errors.join('\n')}`);
  }

  for (const path of mappablePaths) {
    const sourceModule = path.node.source.value as string;
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

export default transform;
