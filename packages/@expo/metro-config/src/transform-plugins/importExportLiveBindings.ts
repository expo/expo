import type { ConfigAPI, PluginObj, NodePath, types as t } from '@babel/core';

import {
  defaultWrapHelper,
  namespaceWrapHelper,
  requireCall,
  liveExportAllHelper,
  liveExportHelper,
  assignExportHelper,
  varDeclaratorHelper,
  esModuleExportTemplate,
  varDeclaratorCallHelper,
  withLocation,
  sideEffectRequireCall,
} from './helpers';

export interface Options {
  readonly resolve: boolean;
  readonly out?: {
    isESModule: boolean;
  };
}

type ModuleRequest = t.StringLiteral;
type ID = string;

const enum ImportDeclarationKind {
  REQUIRE = 'REQUIRE',
  IMPORT_DEFAULT = 'DEFAULT',
  IMPORT_NAMESPACE = 'NAMESPACE',
}

/** Record of specifiers (arbitrary name, default, or namespace import, to local IDs) */
interface ModuleSpecifiers {
  [ImportDeclarationKind.REQUIRE]?: ID;
  [ImportDeclarationKind.IMPORT_DEFAULT]?: ID;
  [ImportDeclarationKind.IMPORT_NAMESPACE]?: ID;
  /** Marks that the require call should be kept due to a side-effect */
  sideEffect?: boolean;
}

/** Instruction for how to replace an expression when inlining */
interface InlineRef {
  /** ID to access (MemberExpression.object) */
  parentId: ID;
  /** Specifier property to access (undefined for direct namespace access) */
  member: 'default' | (string & {}) | undefined;
  /** The original source location */
  loc: t.SourceLocation | null | undefined;
}

interface ImportDeclaration {
  kind: ImportDeclarationKind;
  source: ModuleRequest;
  local: ID | undefined;
  loc: t.SourceLocation | null | undefined;
}

interface ExportDeclaration {
  statement: t.Statement;
  local: ID | undefined;
}

interface State {
  readonly opts: Options;

  importSpecifiers: Map<ModuleRequest, ModuleSpecifiers>;

  /** Identifiers referencing import specifiers that should be rewritten (ID/key will be replaced) */
  inlineBodyRefs: Map<ID, InlineRef>;
  /** Identifiers by name that are referenced in the output */
  referencedLocals: Set<ID>;
  /** Cached untransformed export statements */
  exportStatements: t.ExportNamedDeclaration[];

  /** Transformed exports to add to the body, while referencing ID */
  exportDeclarations: ExportDeclaration[];
  /** Transformed export namespaces to add to the body, while referencing ID */
  exportAll: Map<ID, t.Statement>;
  /** Transformed imports to add to the body, if IDs referenced */
  importDeclarations: ImportDeclaration[];
}

export function importExportLiveBindingsPlugin({
  template,
  types: t,
}: ConfigAPI & typeof import('@babel/core')): PluginObj<State> {
  const addModuleSpecifiers = (state: State, source: ModuleRequest): ModuleSpecifiers => {
    let moduleSpecifiers = state.importSpecifiers.get(source);
    if (!moduleSpecifiers) {
      moduleSpecifiers = Object.create(null) as ModuleSpecifiers;
      state.importSpecifiers.set(source, moduleSpecifiers);
    }
    return moduleSpecifiers;
  };

  const addImport = (path: NodePath, state: State, source: ModuleRequest): ID => {
    const moduleSpecifiers = addModuleSpecifiers(state, source);
    let id = moduleSpecifiers[ImportDeclarationKind.REQUIRE];
    if (!id) {
      id = path.scope.generateUid(source.value);
      moduleSpecifiers[ImportDeclarationKind.REQUIRE] = id;
      state.importDeclarations.push({
        kind: ImportDeclarationKind.REQUIRE,
        local: undefined,
        source,
        loc: path.node.loc,
      });
    }
    return id;
  };
  const addDefaultImport = (
    path: NodePath,
    state: State,
    source: ModuleRequest,
    name?: string
  ): ID => {
    const moduleSpecifiers = addModuleSpecifiers(state, source);
    let id = moduleSpecifiers[ImportDeclarationKind.IMPORT_DEFAULT];
    if (!id) {
      // Use the given name, if possible, or generate one. If no initial name is given,
      // we'll create one based on the parent import
      const parentImportLocal = addImport(path, state, source);
      id =
        !name || !t.isValidIdentifier(name)
          ? path.scope.generateUid(name ?? parentImportLocal)
          : name;
      moduleSpecifiers[ImportDeclarationKind.IMPORT_DEFAULT] = id;
      state.importDeclarations.push({
        kind: ImportDeclarationKind.IMPORT_DEFAULT,
        local: parentImportLocal,
        source,
        loc: path.node.loc,
      });
    }
    return id;
  };
  const addNamespaceImport = (
    path: NodePath,
    state: State,
    source: ModuleRequest,
    name?: string
  ): ID => {
    const moduleSpecifiers = addModuleSpecifiers(state, source);
    let id = moduleSpecifiers[ImportDeclarationKind.IMPORT_NAMESPACE];
    if (!id) {
      // Use the given name, if possible, or generate one. If no initial name is given,
      // we'll create one based on the parent import
      const parentImportLocal = addImport(path, state, source);
      id =
        !name || !t.isValidIdentifier(name)
          ? path.scope.generateUid(name ?? parentImportLocal)
          : name;
      moduleSpecifiers[ImportDeclarationKind.IMPORT_NAMESPACE] = id;
      state.importDeclarations.push({
        kind: ImportDeclarationKind.IMPORT_NAMESPACE,
        local: parentImportLocal,
        source,
        loc: path.node.loc,
      });
    }
    return id;
  };
  const addSideeffectImport = (path: NodePath, state: State, source: ModuleRequest): void => {
    const moduleSpecifiers = addModuleSpecifiers(state, source);
    moduleSpecifiers.sideEffect = true;
    addImport(path, state, source);
  };

  return {
    visitor: {
      // (1): Scan imports and prepare require calls
      ImportDeclaration(path, state) {
        if (path.node.importKind && path.node.importKind !== 'value') {
          path.remove();
          return;
        }
        const source: ModuleRequest = path.node.source;
        if (!path.node.specifiers.length) {
          addSideeffectImport(path, state, source);
          path.remove();
          return;
        }
        for (const specifier of path.node.specifiers) {
          const localId = specifier.local.name;
          let importId: ID;
          let member: string | undefined;
          switch (specifier.type) {
            case 'ImportNamespaceSpecifier':
              // The `namespaceWrapHelper` ensures a namespace object, but namespaces are accessed directly
              member = undefined;
              importId = addNamespaceImport(path, state, source, localId);
              break;
            case 'ImportSpecifier':
              if (specifier.importKind && specifier.importKind !== 'value') {
                continue;
              }
              member = t.isIdentifier(specifier.imported)
                ? specifier.imported.name
                : specifier.imported.value;
              // An imported default specifier is the same as an ImportDefaultSpecifier
              importId =
                member === 'default'
                  ? addDefaultImport(path, state, source, localId)
                  : addImport(path, state, source);
              break;
            case 'ImportDefaultSpecifier':
              // The `defaultWrapHelper` works by wrapping CommonJS modules in a fake module wrapper
              member = 'default';
              importId = addDefaultImport(path, state, source, localId);
              break;
          }

          state.inlineBodyRefs.set(localId, {
            parentId: importId,
            member,
            loc: path.node.loc,
          });
        }
        path.remove();
      },

      // (2.1): Declare live exports for ExportAllDeclarations immediately (References the import)
      ExportAllDeclaration(path, state) {
        if (path.node.exportKind && path.node.exportKind !== 'value') {
          path.remove();
          return;
        }
        const loc = path.node.loc;
        const source: ModuleRequest = path.node.source;
        const importId = addImport(path, state, source);
        if (!state.exportAll.has(importId)) {
          state.referencedLocals.add(importId);
          state.exportAll.set(importId, withLocation(liveExportAllHelper(template, importId), loc));
        }
        path.remove();
      },

      // (2.2): Store ExportDefaultDeclaration for later, for processing after all imports are evaluated
      ExportDefaultDeclaration(path, state) {
        if (path.node.exportKind && path.node.exportKind !== 'value') {
          path.remove();
          return;
        }
        let localId: string;
        // We purposefully don't check for `Identifier` or `MemberExpression` here
        // `export default` values are assigne at the point they're declared. We don't want them to be mutated
        if (t.isDeclaration(path.node.declaration)) {
          if (!path.node.declaration.id) {
            path.node.declaration.id = path.scope.generateUidIdentifierBasedOnNode(
              path.node.declaration
            );
          }
          localId = path.node.declaration.id.name;
          path.replaceWith(path.node.declaration);
        } else {
          localId = path.scope.generateUid('_default');
          path.replaceWith(
            withLocation(
              varDeclaratorHelper(t, localId, path.node.declaration),
              path.node.loc
            )
          );
        }
        state.exportDeclarations.push({
          statement: withLocation(
            liveExportHelper(t, 'default', t.identifier(localId)),
            path.node.loc
          ),
          local: undefined,
        });
      },

      // (2.3): Store ExportNamedDeclaration for later (if it has a local declaration), for processing after all imports are evaluated
      // - If we have a source, create live bindings immediately for specifiers (References the import)
      ExportNamedDeclaration(path, state) {
        if (path.node.exportKind && path.node.exportKind !== 'value') {
          path.remove();
          return;
        } else if (path.node.declaration || !path.node.source) {
          state.exportStatements.push(path.node);
          if (path.node.declaration) {
            // If we have a declaration, we'll replace the export with it
            // In (3.1), we can then refer to the declarations by their local ids
            path.replaceWith(path.node.declaration);
            path.skip();
            if (!path.node.source) {
              return;
            }
          } else if (!path.node.source) {
            path.remove();
            return;
          }
        }
        const source: ModuleRequest = path.node.source;
        if (!path.node.specifiers.length) {
          addSideeffectImport(path, state, source);
          path.remove();
          return;
        }
        for (const specifier of path.node.specifiers) {
          let importId: ID;
          let specifierLocal: string | undefined;
          let exportExpression: t.Expression;
          switch (specifier.type) {
            case 'ExportNamespaceSpecifier':
              // The `namespaceWrapHelper` ensures a namespace object, but namespaces are accessed directly
              specifierLocal = undefined;
              importId = addNamespaceImport(path, state, source);
              exportExpression = t.identifier(importId);
              break;
            case 'ExportSpecifier':
              if (specifier.exportKind && specifier.exportKind !== 'value') {
                continue;
              }
              specifierLocal = specifier.local.name;
              // An imported default specifier is the same as an ImportDefaultSpecifier
              importId =
                specifierLocal === 'default'
                  ? addDefaultImport(path, state, source)
                  : addImport(path, state, source);
              exportExpression = t.memberExpression(
                t.identifier(importId),
                t.identifier(specifierLocal)
              );
              break;
            case 'ExportDefaultSpecifier':
              // The `defaultWrapHelper` works by wrapping CommonJS modules in a fake module wrapper
              specifierLocal = 'default';
              importId = addDefaultImport(path, state, source);
              exportExpression = t.memberExpression(
                t.identifier(importId),
                t.identifier(specifierLocal)
              );
              break;
          }
          const exportName = t.isIdentifier(specifier.exported)
            ? specifier.exported.name
            : specifier.exported.value;
          state.referencedLocals.add(importId);
          state.exportDeclarations.push({
            statement: withLocation(
              liveExportHelper(t, exportName, exportExpression),
              path.node.loc
            ),
            local: importId,
          });
        }
        path.remove();
      },

      Program: {
        // (0): Initialize all state
        enter(_path, state) {
          state.importSpecifiers = new Map();
          state.inlineBodyRefs = new Map();
          state.referencedLocals = new Set();
          state.exportStatements = [];
          state.exportDeclarations = [];
          state.exportAll = new Map();
          state.importDeclarations = [];
        },

        exit(path, state) {
          function getInlineRefExpression(
            node: t.Identifier,
            localId: string
          ): t.Expression | undefined;
          function getInlineRefExpression(
            node: t.JSXIdentifier | t.Identifier,
            localId: string
          ): t.JSXMemberExpression | t.Expression | undefined;
          function getInlineRefExpression(
            node: t.Identifier | t.JSXIdentifier,
            localId: string
          ): t.Node | undefined {
            const inlineRef = state.inlineBodyRefs.get(localId);
            if (!inlineRef) return undefined;
            // Reference count the target ID to ensure its import will be added,
            // then replace this ID with the InlineRef
            state.referencedLocals.add(inlineRef.parentId);
            let refNode: t.Node;
            if (inlineRef.member == null) {
              refNode = t.identifier(inlineRef.parentId);
            } else if (node.type === 'JSXIdentifier') {
              refNode = t.jsxMemberExpression(
                t.jsxIdentifier(inlineRef.parentId),
                t.jsxIdentifier(inlineRef.member)
              );
            } else {
              refNode = t.memberExpression(
                t.identifier(inlineRef.parentId),
                t.identifier(inlineRef.member)
              );
            }
            return withLocation(refNode, inlineRef.loc);
          }

          // (3): Process all "deferred" export declarations in `state.exportDeclarations`
          for (const exportStatement of state.exportStatements) {
            // (3.1): Convert all local exports into export declarations, while making sure
            // to reference imports if necessary
            if (!exportStatement.source && exportStatement.specifiers) {
              for (const specifier of exportStatement.specifiers) {
                if (specifier.type !== 'ExportSpecifier') {
                  continue; // NOTE: This is not a legal AST type without `source`
                } else if (specifier.exportKind && specifier.exportKind !== 'value') {
                  continue;
                }
                const exportName = t.isIdentifier(specifier.exported)
                  ? specifier.exported.name
                  : specifier.exported.value;
                const exportExpression =
                  getInlineRefExpression(specifier.local, specifier.local.name) ?? specifier.local;
                state.exportDeclarations.push({
                  statement: withLocation(
                    liveExportHelper(t, exportName, exportExpression),
                    exportStatement.loc
                  ),
                  local: undefined,
                });
              }
            }

            // (3.2): Process all locally exported declarations
            const declaration = exportStatement.declaration;
            if (declaration) {
              // Live bindings are used for variables, since they can be reassigned and may not be declared until later on
              const exportHelper =
                declaration.type === 'VariableDeclaration' ||
                declaration.type !== 'FunctionDeclaration'
                  ? liveExportHelper
                  : assignExportHelper;
              const exportBindings = t.getBindingIdentifiers(declaration, false, true);
              for (const exportName in exportBindings) {
                state.exportDeclarations.push({
                  statement: withLocation(
                    exportHelper(t, exportName, t.identifier(exportBindings[exportName].name)),
                    exportStatement.loc
                  ),
                  local: undefined,
                });
              }
            }
          }

          // (4): Traverse reference identifiers and replace as needed with `state.inlineBodyRefs`'
          // synthetic IDs, while marking the IDs that are referenced in `state.syntheticRefs`
          path.traverse(
            {
              ReferencedIdentifier(path, state) {
                if (path.parent.type === 'ExportSpecifier') {
                  return;
                }
                const localId = path.node.name;
                // We skip this identifier if it's not a program binding, since
                // that means it was declared in a child scope
                const localBinding = path.scope.getBinding(localId);
                const rootBinding = state.programScope.getBinding(localId);
                if (rootBinding !== localBinding) return;
                // Replace the local ID with the inlined reference, if there is one
                const inlineRefExpression = getInlineRefExpression(path.node, localId);
                if (inlineRefExpression) {
                  path.replaceWith(inlineRefExpression);
                  path.skip();
                }
              },
            },
            {
              referencedLocals: state.referencedLocals,
              inlineBodyRefs: state.inlineBodyRefs,
              programScope: path.scope,
            }
          );

          const preambleStatements: t.Statement[] = [];
          const esmStatements: t.Statement[] = [];

          let _defaultWrapName: string | null;
          const wrapDefault = (localId: string, sourceId: string) => {
            if (!_defaultWrapName) {
              _defaultWrapName = '_interopDefault';
              preambleStatements.push(defaultWrapHelper(template, _defaultWrapName));
            }
            return varDeclaratorCallHelper(t, localId, _defaultWrapName, sourceId);
          };

          let _namespaceWrapName: string | null;
          const wrapNamespace = (localId: string, sourceId: string) => {
            if (!_namespaceWrapName) {
              _namespaceWrapName = '_interopNamespace';
              preambleStatements.push(namespaceWrapHelper(template, _namespaceWrapName));
            }
            return varDeclaratorCallHelper(t, localId, _namespaceWrapName, sourceId);
          };

          // (5): Add all exports, and all referenced imports
          for (const exportDeclaration of state.exportDeclarations) {
            esmStatements.push(exportDeclaration.statement);
            if (exportDeclaration.local) {
              state.referencedLocals.add(exportDeclaration.local);
            }
          }
          // Namespace exports must be placed after all explicitly named exports
          const earlyImports: Record<ID, number | undefined> = Object.create(null);
          for (const [localId, exportNamespaceStatement] of state.exportAll) {
            // We must hoist the import for this export-namespace early
            earlyImports[localId] ??= esmStatements.length;
            esmStatements.push(exportNamespaceStatement);
            state.referencedLocals.add(localId);
          }
          // Add `__esModule` marker if we have any exports
          if (esmStatements.length) {
            preambleStatements.push(esModuleExportTemplate(template));
          }
          // Reference locals that are referenced by import declarations
          for (const importDeclaration of state.importDeclarations) {
            // NOTE(@kitten): The first check removes default/namespace import wrappers when they're unused.
            // This diverges from the previous implementation a lot, and is basically unused local elimination
            // If we don't want this, this can safely be removed
            const source = importDeclaration.source;
            const local = addModuleSpecifiers(state, source)[importDeclaration.kind];
            if (!local || !state.referencedLocals.has(local)) {
              continue;
            } else if (importDeclaration.local) {
              state.referencedLocals.add(importDeclaration.local);
            }
          }
          // Insert imports, if they're referenced
          let earlyImportSkew = 0;
          for (const importDeclaration of state.importDeclarations) {
            const source = importDeclaration.source;
            const moduleSpecifiers = addModuleSpecifiers(state, source);
            const local = moduleSpecifiers[importDeclaration.kind];
            if (!local || !state.referencedLocals.has(local)) {
              // Don't add imports that aren't referenced, unless they're required for a side-effect
              if (moduleSpecifiers.sideEffect) {
                esmStatements.push(
                  withLocation(sideEffectRequireCall(t, source), importDeclaration.loc)
                );
              }
              continue;
            }
            let importStatement: t.Statement;
            switch (importDeclaration.kind) {
              case ImportDeclarationKind.REQUIRE:
                importStatement = requireCall(t, local, source);
                break;
              case ImportDeclarationKind.IMPORT_DEFAULT:
                importStatement = wrapDefault(local, importDeclaration.local!);
                break;
              case ImportDeclarationKind.IMPORT_NAMESPACE:
                importStatement = wrapNamespace(local, importDeclaration.local!);
                break;
            }
            importStatement = withLocation(importStatement, importDeclaration.loc);
            if (earlyImports[local] != null) {
              // An `exportAll` reexport, requires this import to be higher up
              const startIndex = earlyImports[local] + earlyImportSkew++;
              esmStatements.splice(startIndex, 0, importStatement);
            } else {
              esmStatements.push(importStatement);
            }
          }

          // WARN(@kitten): This isn't only dependent on exports! If we set this to `false` but
          // added any imports, then those imports will accidentally be shifted back to CJS-mode
          if (esmStatements.length && state.opts.out) {
            state.opts.out.isESModule = true;
          }

          path.node.body = [...preambleStatements, ...esmStatements, ...path.node.body];
        },
      },
    },
  };
}
