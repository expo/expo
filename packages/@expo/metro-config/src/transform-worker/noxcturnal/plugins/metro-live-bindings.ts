import type { DefinedNativePlugin } from 'noxcturnal';

import {
  metroPluginData,
  type MetroLiveBindingsState,
  type Noxcturnal,
} from '../noxcturnal-transformer';
import { registerNativeEsmDependency } from './metro-dependency';

export function createMetroLiveBindingsPlugin(
  nox: Noxcturnal,
  liveBindings = true
): DefinedNativePlugin<MetroLiveBindingsState> {
  const generateUid = (scope: { generateUid(name: string): string }, input: string) => {
    let name = input.replace(/[^$0-9A-Z_a-z]/g, '-').replace(/^[-0-9]+/, '');
    name = name.replace(/[-\s]+(.)?/g, (_match, next: string | undefined) =>
      next ? next.toUpperCase() : ''
    );
    if (!/^[$A-Z_a-z]/.test(name)) name = `_${name}`;
    name = (name || '_').replace(/^_+/, '').replace(/\d+$/g, '');
    return scope.generateUid(name);
  };
  const property = (object: string, name: string) => `${object}.${name}`;
  const exportsName = (context: { pluginData: unknown }) =>
    metroPluginData(context).normalizePseudoGlobals ? 'e' : 'exports';
  const liveExport = (name: string, expression: string, target = 'exports') =>
    `Object.defineProperty(${target}, ${JSON.stringify(name)}, { enumerable: true, get: function () { return ${expression}; } });`;
  const exportValue = (name: string, expression: string, target = 'exports') =>
    liveBindings ? liveExport(name, expression, target) : `${target}.${name} = ${expression};`;
  const defaultInterop = `function _interopDefault(e) {
  return e && e.__esModule ? e : { default: e };
}`;
  const namespaceInterop = `function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = {};
  if (e) Object.keys(e).forEach(function (k) {
    var d = Object.getOwnPropertyDescriptor(e, k);
    Object.defineProperty(n, k, d.get ? d : {
      enumerable: true,
      get: function () { return e[k]; }
    });
  });
  n.default = e;
  return n;
}`;

  return nox.defineNativePlugin<MetroLiveBindingsState>({
    name: 'metro-native-import-export-live-bindings',
    createState: () => ({
      sawEsm: false,
      modules: new Map(),
      moduleOrder: [],
      importedBindings: new Map(),
      exportStatements: [],
      deferredExports: [],
    }),
    post(context, state) {
      const { collectOnly } = metroPluginData(context);
      if (collectOnly || !state.sawEsm) return;
      const target = exportsName(context);
      const trailingExports: string[] = [];

      for (const deferred of state.deferredExports) {
        if (deferred.kind === 'declaration') {
          const statement =
            (!liveBindings || deferred.assign) && deferred.name !== '__proto__'
              ? `${target}.${deferred.name} = ${deferred.name};`
              : exportValue(deferred.name, deferred.name, target);
          if (liveBindings) state.exportStatements.push(statement);
          else trailingExports.push(statement);
          continue;
        }
        const expression = state.importedBindings.get(deferred.local) ?? deferred.local;
        for (const module of state.moduleOrder) {
          if (
            (module.defaultLocal != null &&
              (expression === module.defaultLocal ||
                expression.startsWith(`${module.defaultLocal}.`))) ||
            (module.namespaceLocal != null && expression === module.namespaceLocal) ||
            expression.startsWith(`${module.requiredLocal}.`)
          ) {
            module.referenced = true;
            if (
              module.defaultLocal != null &&
              (expression === module.defaultLocal ||
                expression.startsWith(`${module.defaultLocal}.`))
            ) {
              module.defaultReferenced = true;
            }
            if (module.namespaceLocal != null && expression === module.namespaceLocal) {
              module.namespaceReferenced = true;
            }
          }
        }
        const statement = exportValue(deferred.exported, expression, target);
        if (liveBindings) state.exportStatements.push(statement);
        else trailingExports.push(statement);
      }
      const preamble: string[] = [];
      if (
        state.exportStatements.length > 0 ||
        trailingExports.length > 0 ||
        state.moduleOrder.some((module) =>
          module.afterImport.some((operation) => operation.kind === 'statement')
        )
      ) {
        preamble.push(`Object.defineProperty(${target}, '__esModule', { value: true });`);
      }
      const emittedInterops = new Set<'default' | 'namespace'>();
      for (const module of state.moduleOrder) {
        for (const operation of module.afterImport) {
          const interop =
            operation.kind === 'default-interop'
              ? 'default'
              : operation.kind === 'namespace-interop'
                ? 'namespace'
                : null;
          if (
            interop != null &&
            !emittedInterops.has(interop) &&
            (interop === 'default' ? module.defaultReferenced : module.namespaceReferenced)
          ) {
            emittedInterops.add(interop);
            preamble.push(interop === 'default' ? defaultInterop : namespaceInterop);
          }
        }
      }
      if (liveBindings) preamble.push(...state.exportStatements);
      for (const module of state.moduleOrder) {
        if (!module.referenced) {
          if (module.sideEffect) preamble.push(`${module.requireCall};`);
          continue;
        }
        preamble.push(`var ${module.requiredLocal} = ${module.requireCall};`);
        for (const operation of module.afterImport) {
          if (
            operation.kind === 'statement' ||
            (operation.kind === 'default-interop' && module.defaultReferenced) ||
            (operation.kind === 'namespace-interop' && module.namespaceReferenced)
          ) {
            preamble.push(operation.code);
          }
        }
      }
      if (!liveBindings) trailingExports.unshift(...state.exportStatements);
      if (preamble.length > 0) {
        context.prependToProgram(preamble.join('\n'));
      }
      if (trailingExports.length > 0) {
        context.appendToProgram(trailingExports.join('\n'));
      }
    },
    visitors: [
      nox.defineVisitor(
        'ImportDeclaration',
        {
          fields: ['source', 'importKind'],
          scope: true,
          ancestry: { mode: 'parent' },
          children: {
            specifiers: {
              route: 'ImportSpecifier|ImportDefaultSpecifier|ImportNamespaceSpecifier',
              fields: ['local', 'imported', 'importKind'],
            },
          },
        },
        (importPath, state) => {
          const { collectOnly, shared, input } = metroPluginData(importPath.context);
          state.sawEsm = true;
          if (importPath.node.importKind && importPath.node.importKind !== 'value') {
            if (!collectOnly) importPath.remove();
            return;
          }
          const source = importPath.node.source;
          if (collectOnly) {
            const dependencyState = shared.state;
            if (!dependencyState) importPath.unsupported('missing-shared-dependency-state');
            registerNativeEsmDependency(
              dependencyState!,
              source,
              importPath.getLocation(),
              importPath
                .getChildList('specifiers')
                .map((specifier) =>
                  specifier.node.type === 'ImportNamespaceSpecifier'
                    ? '*'
                    : specifier.node.type === 'ImportDefaultSpecifier'
                      ? 'default'
                      : String(specifier.node.imported)
                )
            );
            return;
          }
          const specifiers = importPath.getChildList('specifiers');
          const valueSpecifiers = specifiers.filter(
            (specifier) =>
              specifier.node.type !== 'ImportSpecifier' ||
              !specifier.node.importKind ||
              specifier.node.importKind === 'value'
          );
          if (specifiers.length > 0 && valueSpecifiers.length === 0) {
            importPath.remove();
            return;
          }
          let module = state.modules.get(source);
          if (!module) {
            const dependencyState = shared.state;
            if (!dependencyState) importPath.unsupported('missing-shared-dependency-state');
            const dependency = registerNativeEsmDependency(
              dependencyState!,
              source,
              importPath.getLocation()
            );
            const dependencyArgument = `${dependencyState!.dependencyMapName}[${dependency.index}]`;
            const requiredLocal = generateUid(importPath.scope.getProgramParent(), source);
            module = {
              source,
              requiredLocal,
              requireCall: `${dependencyState!.requireName}(${dependencyArgument}, ${JSON.stringify(source)})`,
              afterImport: [],
              exportAll: false,
              referenced: false,
              defaultReferenced: false,
              namespaceReferenced: false,
              sideEffect:
                input.options.dev &&
                importPath.context.metadata.get('performConstantFolding') !== true,
            };
            state.modules.set(source, module);
            state.moduleOrder.push(module);
          }
          if (specifiers.length === 0) module.sideEffect = true;
          const bindings = new Map(
            importPath.scope
              .getBindings(valueSpecifiers.map((specifier) => String(specifier.node.local)))
              .map((binding) => [binding.name, binding])
          );
          for (const specifier of specifiers) {
            if (
              specifier.node.type === 'ImportSpecifier' &&
              specifier.node.importKind &&
              specifier.node.importKind !== 'value'
            ) {
              continue;
            }
            const local = String(specifier.node.local);
            const requiredLocal = module.requiredLocal;
            let expression: string;
            if (specifier.node.type === 'ImportNamespaceSpecifier') {
              if (module.namespaceLocal == null) {
                module.namespaceLocal = local;
                module.afterImport.push({
                  kind: 'namespace-interop',
                  code: `var ${module.namespaceLocal} = _interopNamespace(${module.requiredLocal});`,
                });
              }
              expression = module.namespaceLocal;
            } else {
              const imported =
                specifier.node.type === 'ImportDefaultSpecifier'
                  ? 'default'
                  : String(specifier.node.imported);
              if (imported === 'default') {
                if (module.defaultLocal == null) {
                  module.defaultLocal = local;
                  module.afterImport.push({
                    kind: 'default-interop',
                    code: `var ${module.defaultLocal} = _interopDefault(${module.requiredLocal});`,
                  });
                }
                expression = property(module.defaultLocal, 'default');
              } else {
                if (liveBindings) {
                  expression = property(requiredLocal, imported);
                } else {
                  expression = local;
                  module.afterImport.push({
                    kind: 'statement',
                    code: `var ${local} = ${property(requiredLocal, imported)};`,
                  });
                }
              }
            }
            state.importedBindings.set(local, expression);
            const binding = bindings.get(local);
            if (!binding) importPath.unsupported(`missing-import-binding:${local}`);
            for (const reference of binding?.references ?? []) {
              module.referenced = true;
              if (specifier.node.type === 'ImportNamespaceSpecifier') {
                module.namespaceReferenced = true;
              } else if (
                specifier.node.type === 'ImportDefaultSpecifier' ||
                String(specifier.node.imported) === 'default'
              ) {
                module.defaultReferenced = true;
              }
              if (reference.parentType === 'ExportSpecifier') continue;
              if (expression === local) continue;
              if (reference.start == null || reference.end == null) {
                importPath.unsupported(`missing-import-reference-range:${local}`);
              }
              const preservesLocalReference =
                expression.startsWith(`${local}.`) || expression.startsWith(`${local}[`);
              if (preservesLocalReference) {
                if (
                  reference.parentType === 'CallExpression' &&
                  reference.parentStart === reference.start
                ) {
                  importPath.context.editor.appendLeft(reference.start!, '(0, ');
                  importPath.context.editor.appendRight(
                    reference.end!,
                    `${expression.slice(local.length)})`
                  );
                } else if (
                  reference.parentType === 'ObjectProperty' &&
                  reference.parentStart === reference.start
                ) {
                  importPath.context.editor.appendRight(reference.end!, `: ${expression}`);
                } else {
                  importPath.context.editor.appendRight(
                    reference.end!,
                    expression.slice(local.length)
                  );
                }
              } else {
                const replacement =
                  reference.parentType === 'CallExpression' &&
                  reference.parentStart === reference.start
                    ? `(0, ${expression})`
                    : reference.parentType === 'ObjectProperty' &&
                        reference.parentStart === reference.start
                      ? `${local}: ${expression}`
                      : expression;
                importPath.context.editor.overwrite(reference.start!, reference.end!, replacement);
              }
            }
          }
          importPath.remove();
        }
      ),
      nox.defineVisitor(
        'ExportNamedDeclaration',
        {
          fields: ['source', 'exportKind'],
          scope: true,
          controlFlow: ['nested-traverse'],
          nested: [
            nox.defineVisitor('Identifier', { fields: ['name', 'binding'], scope: true }, () => {}),
          ],
          children: {
            declaration: { route: 'Declaration', fields: ['name', 'nodeKind'] },
            specifiers: {
              route: 'ExportSpecifier',
              fields: ['local', 'exported', 'exportKind'],
            },
          },
        },
        (exportPath, state) => {
          const { collectOnly, shared } = metroPluginData(exportPath.context);
          state.sawEsm = true;
          if (exportPath.node.exportKind && exportPath.node.exportKind !== 'value') {
            if (!collectOnly) exportPath.remove();
            return;
          }
          if (exportPath.node.source) {
            const source = exportPath.node.source;
            const exportSpecifiers = exportPath.getChildList('specifiers');
            const valueExportSpecifiers = exportSpecifiers.filter(
              (specifier) => !specifier.node.exportKind || specifier.node.exportKind === 'value'
            );
            if (collectOnly) {
              const dependencyState = shared.state;
              if (!dependencyState) exportPath.unsupported('missing-shared-dependency-state');
              registerNativeEsmDependency(
                dependencyState!,
                source,
                exportPath.getLocation(),
                exportSpecifiers.map((specifier) => String(specifier.node.local))
              );
              return;
            }
            if (exportSpecifiers.length > 0 && valueExportSpecifiers.length === 0) {
              exportPath.remove();
              return;
            }
            let module = state.modules.get(source);
            if (!module) {
              const dependencyState = shared.state;
              if (!dependencyState) exportPath.unsupported('missing-shared-dependency-state');
              const dependency = registerNativeEsmDependency(
                dependencyState!,
                source,
                exportPath.getLocation()
              );
              const dependencyArgument = `${dependencyState!.dependencyMapName}[${dependency.index}]`;
              const requiredLocal = generateUid(exportPath.scope.getProgramParent(), source);
              module = {
                source,
                requiredLocal,
                requireCall: `${dependencyState!.requireName}(${dependencyArgument}, ${JSON.stringify(source)})`,
                afterImport: [],
                exportAll: false,
                referenced: valueExportSpecifiers.length > 0,
                defaultReferenced: false,
                namespaceReferenced: false,
                sideEffect: exportSpecifiers.length === 0,
              };
              state.modules.set(source, module);
              state.moduleOrder.push(module);
            }
            if (exportSpecifiers.length === 0) module.sideEffect = true;
            else module.referenced = true;
            const requiredLocal = module.requiredLocal;
            for (const specifier of valueExportSpecifiers) {
              const imported = String(specifier.node.local);
              let expression: string;
              if (imported === 'default') {
                if (module.defaultLocal == null) {
                  module.defaultLocal = generateUid(
                    exportPath.scope.getProgramParent(),
                    requiredLocal
                  );
                  module.afterImport.push({
                    kind: 'default-interop',
                    code: `var ${module.defaultLocal} = _interopDefault(${module.requiredLocal});`,
                  });
                }
                module.defaultReferenced = true;
                expression = property(module.defaultLocal, 'default');
              } else {
                expression = property(requiredLocal, imported);
              }
              if (!liveBindings) {
                const snapshot = generateUid(exportPath.scope.getProgramParent(), imported);
                module.afterImport.push({
                  kind: 'statement',
                  code: `var ${snapshot} = ${expression};`,
                });
                expression = snapshot;
              }
              state.exportStatements.push(
                exportValue(
                  String(specifier.node.exported),
                  expression,
                  exportsName(exportPath.context)
                )
              );
            }
            exportPath.remove();
            return;
          }
          if (collectOnly) return;
          const declaration = exportPath.getChild('declaration');
          if (declaration) {
            const names = new Set<string>();
            if (typeof declaration.node.name === 'string') {
              names.add(declaration.node.name);
            } else {
              declaration.traverse([
                nox.defineVisitor(
                  'Identifier',
                  { fields: ['name', 'binding'], scope: true },
                  (identifier) => {
                    if (
                      identifier.node.binding === true &&
                      identifier.scope.id === exportPath.scope.id
                    ) {
                      names.add(String(identifier.node.name));
                    }
                  }
                ),
              ]);
            }
            exportPath.replaceWith(declaration.getSource());
            for (const name of names) {
              state.deferredExports.push({
                kind: 'declaration',
                name,
                assign: declaration.node.nodeKind === 'FunctionDeclaration',
              });
            }
            return;
          }
          for (const specifier of exportPath.getChildList('specifiers')) {
            if (specifier.node.exportKind && specifier.node.exportKind !== 'value') continue;
            state.deferredExports.push({
              kind: 'specifier',
              local: String(specifier.node.local),
              exported: String(specifier.node.exported),
            });
          }
          exportPath.remove();
        }
      ),
      nox.defineVisitor(
        'ExportDefaultDeclaration',
        {
          fields: ['declaredName'],
          scope: true,
          children: {
            declaration: {
              route: 'Declaration|Expression',
              fields: ['nodeKind', 'declarationNameAnchor', 'declarationNamePrefix'],
            },
          },
        },
        (exportPath, state) => {
          const { collectOnly } = metroPluginData(exportPath.context);
          state.sawEsm = true;
          if (collectOnly) return;
          const declaration = exportPath.getChild('declaration');
          if (!declaration) exportPath.unsupported('missing-default-export-declaration');
          const hasDeclaredName = typeof exportPath.node.declaredName === 'string';
          let local = hasDeclaredName ? exportPath.node.declaredName! : null;
          if (local) {
            exportPath.replaceWith(declaration!.getSource());
          } else {
            if (declaration!.node.type === 'Class' || declaration!.node.type === 'Function') {
              local = exportPath.scope.generateUid('ref');
              exportPath.replaceWith(declaration!.withDeclarationName(local));
            } else {
              local = exportPath.scope.generateUid('default');
              exportPath.replaceWith(
                exportPath.context.code.template`var ${local} = ${declaration!.getSource()};`
              );
            }
          }
          if (liveBindings)
            state.exportStatements.push(
              exportValue('default', local, exportsName(exportPath.context))
            );
          else state.deferredExports.push({ kind: 'specifier', local, exported: 'default' });
        }
      ),
      nox.defineVisitor(
        'ExportAllDeclaration',
        { fields: ['source', 'exportKind', 'exported'], scope: true },
        (exportPath, state) => {
          const { collectOnly, shared } = metroPluginData(exportPath.context);
          state.sawEsm = true;
          if (exportPath.node.exportKind && exportPath.node.exportKind !== 'value') {
            if (!collectOnly) exportPath.remove();
            return;
          }
          const source = exportPath.node.source;
          if (collectOnly) {
            const dependencyState = shared.state;
            if (!dependencyState) exportPath.unsupported('missing-shared-dependency-state');
            registerNativeEsmDependency(dependencyState!, source, exportPath.getLocation(), ['*']);
            return;
          }
          let module = state.modules.get(source);
          if (!module) {
            const dependencyState = shared.state;
            if (!dependencyState) exportPath.unsupported('missing-shared-dependency-state');
            const dependency = registerNativeEsmDependency(
              dependencyState!,
              source,
              exportPath.getLocation()
            );
            const dependencyArgument = `${dependencyState!.dependencyMapName}[${dependency.index}]`;
            const requiredLocal = generateUid(exportPath.scope.getProgramParent(), source);
            module = {
              source,
              requiredLocal,
              requireCall: `${dependencyState!.requireName}(${dependencyArgument}, ${JSON.stringify(source)})`,
              afterImport: [],
              exportAll: false,
              referenced: true,
              defaultReferenced: false,
              namespaceReferenced: false,
              sideEffect: false,
            };
            state.modules.set(source, module);
            state.moduleOrder.push(module);
          }
          module.referenced = true;
          const requiredLocal = module.requiredLocal;
          if (typeof exportPath.node.exported === 'string') {
            if (module.namespaceLocal == null) {
              module.namespaceLocal = generateUid(exportPath.scope.getProgramParent(), source);
              module.afterImport.push({
                kind: 'namespace-interop',
                code: `var ${module.namespaceLocal} = _interopNamespace(${module.requiredLocal});`,
              });
            }
            module.namespaceReferenced = true;
            state.exportStatements.push(
              exportValue(
                exportPath.node.exported,
                module.namespaceLocal,
                exportsName(exportPath.context)
              )
            );
          } else {
            if (!module.exportAll) {
              module.exportAll = true;
              const target = exportsName(exportPath.context);
              const code = liveBindings
                ? `Object.keys(${requiredLocal}).forEach(function (k) {
  if (k !== 'default' && !Object.prototype.hasOwnProperty.call(${target}, k)) {
    Object.defineProperty(${target}, k, {
      enumerable: true,
      get: function () { return ${requiredLocal}[k]; }
    });
  }
});`
                : `Object.keys(${requiredLocal}).forEach(function (k) {
  if (k !== 'default' && !Object.prototype.hasOwnProperty.call(${target}, k)) {
    ${target}[k] = ${requiredLocal}[k];
  }
});`;
              if (liveBindings) module.afterImport.push({ kind: 'statement', code });
              else state.exportStatements.push(code);
            }
          }
          exportPath.remove();
        }
      ),
    ],
  });
}
