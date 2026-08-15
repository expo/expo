import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { Code, DefinedNativePlugin } from 'noxcturnal';

import {
  expoPluginInput,
  serverBoundary,
  sortedUniqueCaptureNames,
  type Noxcturnal,
  type NoxcturnalTransformInput,
  type ServerBoundaryShared,
} from '../noxcturnal-transformer';

interface ReactServerActionsState {
  input: NoxcturnalTransformInput;
  boundary: ServerBoundaryShared;
  enabled: boolean;
  moduleId: string;
  registerBinding: string;
  wrapperBinding: string;
  usesCapturedArgs: boolean;
  actions: { localName?: string; exportedName: string }[];
}

export function createReactServerModuleActionsPlugin(
  nox: Noxcturnal
): DefinedNativePlugin<ReactServerActionsState> {
  return nox.defineNativePlugin<ReactServerActionsState>({
    name: 'expo-react-server-module-actions',
    editEffect: 'bindings',
    contract: {
      metadata: { writes: ['reactServerActions', 'reactServerReference'] },
    },
    createState: (context) => {
      const input = expoPluginInput(context);
      return {
        input,
        boundary: serverBoundary(context),
        enabled: false,
        moduleId: './' + path.relative(input.projectRoot, input.filename).split(path.sep).join('/'),
        registerBinding: '',
        wrapperBinding: '',
        usesCapturedArgs: false,
        actions: [],
      };
    },
    visitors: [
      nox.defineVisitor(
        'Program',
        {
          scope: true,
          children: {
            directives: { route: 'Directive', fields: ['value'] },
          },
        },
        (program, state) => {
          state.registerBinding = program.scope.generateUid('registerServerReference');
          state.wrapperBinding = program.scope.generateUid('wrapBoundArgs');
          const directive = program
            .getChildList('directives')
            .find((item) => item.node.value === 'use server');
          if (!directive) return;
          state.enabled = true;
          state.boundary.moduleServerActions = true;
          directive.remove();
        }
      ),
      nox.defineVisitor(
        'ArrowFunctionExpression',
        {
          fields: ['async', 'bodyEnd'],
          scope: true,
          ancestry: { mode: 'programParent' },
          children: {
            body: {
              route: 'FunctionBody',
              children: {
                directives: { route: 'Directive', fields: ['value'] },
              },
            },
            params: {
              route: 'FormalParameter|FormalParameterRest|BindingRestElement',
            },
          },
        },
        (arrow, state) => {
          if (state.enabled) return;
          const body = arrow.getChild('body');
          if (!body || body.node.type !== 'FunctionBody') return;
          const directive = body
            .getChildList('directives')
            .find((item) => item.node.value === 'use server');
          if (!directive) return;
          if (arrow.node.async !== true) {
            arrow.unsupported('server-action-non-async-inline');
          }
          const captures =
            arrow.context.query({
              captures: [{ functionId: arrow.node.id, programBindings: false }],
            }).captures[arrow.node.id] ?? [];
          const capturedNames = sortedUniqueCaptureNames(captures);
          const actionId = arrow.scope.getProgramParent().generateUid('$$INLINE_ACTION');
          const parameters = arrow
            .getChildList('params')
            .map((parameter) => parameter.sourceText())
            .join(', ');
          const bodySource = arrow.context.source.slice(
            directive.node.end,
            Number(arrow.node.bodyEnd)
          );
          const closureParameter =
            capturedNames.length === 0 ? '' : arrow.scope.generateUid('$$CLOSURE');
          const extractedParameters = [...(closureParameter ? [closureParameter] : []), parameters]
            .filter(Boolean)
            .join(', ');
          const closureInit = closureParameter
            ? `var [${capturedNames.join(', ')}] = ${closureParameter}.value;`
            : '';
          arrow
            .getProgramParent()!
            .unshiftContainer(
              'body',
              `export var ${actionId} = ${state.registerBinding}(async (${extractedParameters}) => {${closureInit}${bodySource}}, ${JSON.stringify(state.moduleId)}, ${JSON.stringify(actionId)});`
            );
          arrow.replaceWith(
            closureParameter
              ? `${actionId}.bind(null, ${state.wrapperBinding}(() => [${capturedNames.join(', ')}]))`
              : actionId
          );
          if (closureParameter) state.usesCapturedArgs = true;
          state.boundary.handledDirectives.add(directive.id);
          state.actions.push({ exportedName: actionId });
        }
      ),
      nox.defineVisitor(
        'FunctionExpression',
        {
          fields: ['async', 'generator', 'name', 'bodyEnd'],
          scope: true,
          ancestry: { mode: 'programParent' },
          children: {
            body: {
              route: 'FunctionBody',
              children: {
                directives: { route: 'Directive', fields: ['value'] },
              },
            },
            params: {
              route: 'FormalParameter|FormalParameterRest',
            },
          },
        },
        (fn, state) => {
          if (state.enabled) return;
          const body = fn.getChild('body');
          if (!body || body.node.type !== 'FunctionBody') return;
          const directive = body
            .getChildList('directives')
            .find((item) => item.node.value === 'use server');
          if (!directive) return;
          if (fn.node.async !== true || fn.node.generator === true) {
            fn.unsupported('server-action-non-async-inline');
          }
          const captures =
            fn.context.query({
              captures: [{ functionId: fn.node.id, programBindings: false }],
            }).captures[fn.node.id] ?? [];
          const capturedNames = sortedUniqueCaptureNames(captures);
          const actionId = fn.scope.getProgramParent().generateUid('$$INLINE_ACTION');
          const parameters = fn
            .getChildList('params')
            .map((parameter) => parameter.sourceText())
            .join(', ');
          const bodySource = fn.context.source.slice(directive.node.end, Number(fn.node.bodyEnd));
          const name = typeof fn.node.name === 'string' ? ` ${fn.node.name}` : '';
          const closureParameter =
            capturedNames.length === 0 ? '' : fn.scope.generateUid('$$CLOSURE');
          const extractedParameters = [...(closureParameter ? [closureParameter] : []), parameters]
            .filter(Boolean)
            .join(', ');
          const closureInit = closureParameter
            ? `var [${capturedNames.join(', ')}] = ${closureParameter}.value;`
            : '';
          fn.scope
            .getProgramParent()
            .path!.unshiftContainer(
              'body',
              `export var ${actionId} = ${state.registerBinding}(async function${name}(${extractedParameters}) {${closureInit}${bodySource}}, ${JSON.stringify(state.moduleId)}, ${JSON.stringify(actionId)});`
            );
          fn.replaceWith(
            closureParameter
              ? `${actionId}.bind(null, ${state.wrapperBinding}(() => [${capturedNames.join(', ')}]))`
              : actionId
          );
          if (closureParameter) state.usesCapturedArgs = true;
          state.boundary.handledDirectives.add(directive.id);
          state.actions.push({ exportedName: actionId });
        }
      ),
      nox.defineVisitor(
        'FunctionDeclaration',
        {
          fields: ['async', 'generator', 'name', 'bodyEnd'],
          scope: true,
          ancestry: { mode: 2 },
          children: {
            body: {
              route: 'FunctionBody',
              children: {
                directives: { route: 'Directive', fields: ['value'] },
              },
            },
            params: {
              route: 'FormalParameter|FormalParameterRest',
            },
          },
        },
        (fn, state) => {
          if (state.enabled) return;
          const body = fn.getChild('body');
          if (!body || body.node.type !== 'FunctionBody') return;
          const directive = body
            .getChildList('directives')
            .find((item) => item.node.value === 'use server');
          if (!directive) return;
          if (fn.node.async !== true || fn.node.generator === true) {
            fn.unsupported('server-action-non-async-inline');
          }
          const topLevel =
            fn.parentPath?.node.type === 'Program' ||
            (fn.parentPath?.node.type === 'ExportNamedDeclaration' &&
              fn.parentPath.parentPath?.node.type === 'Program');
          if (!topLevel || typeof fn.node.name !== 'string') {
            fn.unsupported('server-action-nested-function-declaration');
          }
          const actionId = fn.scope.getProgramParent().generateUid('$$INLINE_ACTION');
          const parameters = fn
            .getChildList('params')
            .map((parameter) => parameter.sourceText())
            .join(', ');
          const bodySource = fn.context.source.slice(directive.node.end, Number(fn.node.bodyEnd));
          fn.scope
            .getProgramParent()
            .path!.unshiftContainer(
              'body',
              `export var ${actionId} = ${state.registerBinding}(async function ${fn.node.name}(${parameters}) {${bodySource}}, ${JSON.stringify(state.moduleId)}, ${JSON.stringify(actionId)});`
            );
          fn.replaceWith(`var ${fn.node.name} = ${actionId};`);
          state.boundary.handledDirectives.add(directive.id);
          state.actions.push({
            localName: fn.node.name,
            exportedName: actionId,
          });
        }
      ),
      nox.defineVisitor(
        'ExportDefaultDeclaration',
        {
          ancestry: { mode: 'programParent' },
          scope: true,
          children: {
            declaration: {
              route: 'Function|Expression',
              fields: [
                'nodeKind',
                'name',
                'async',
                'declarationNameAnchor',
                'declarationNamePrefix',
              ],
            },
          },
        },
        (exportPath, state) => {
          if (!state.enabled || exportPath.parentPath?.node.type !== 'Program') return;
          const declaration = exportPath.getChild('declaration') as any;
          if (!declaration) {
            exportPath.unsupported('server-action-default-export');
            return;
          }
          let name: string;
          let declarationSource: Code;
          if (declaration.node.nodeKind === 'FunctionDeclaration') {
            if (declaration.node.async !== true) {
              exportPath.unsupported('server-action-non-async-function');
              return;
            }
            name =
              typeof declaration.node.name === 'string'
                ? declaration.node.name
                : exportPath.scope.getProgramParent().generateUid('$$INLINE_ACTION');
            declarationSource =
              typeof declaration.node.name === 'string'
                ? declaration.getSource()
                : declaration.withDeclarationName(name);
          } else if (
            declaration.node.type === 'ArrowFunctionExpression' &&
            declaration.node.async === true
          ) {
            name = exportPath.scope.getProgramParent().generateUid('$$INLINE_ACTION');
            declarationSource = exportPath.context.code
              .template`var ${name} = ${declaration.getSource()};`;
          } else if (declaration.node.type === 'Identifier') {
            name = declaration.sourceText();
            declarationSource = '';
          } else {
            exportPath.unsupported('server-action-default-export');
            return;
          }
          exportPath.replaceWith(exportPath.context.code.template`${declarationSource}
;(() => ${state.registerBinding}(${name}, ${JSON.stringify(state.moduleId)}, "default"))();
export { ${name} as default };`);
          state.actions.push({ localName: name, exportedName: 'default' });
        }
      ),
      nox.defineVisitor(
        'ExportAllDeclaration',
        { ancestry: { mode: 'programParent' } },
        (exportPath, state) => {
          if (state.enabled && exportPath.parentPath?.node.type === 'Program') {
            exportPath.unsupported('server-action-export-all');
          }
        }
      ),
      nox.defineVisitor(
        'ExportNamedDeclaration',
        {
          fields: ['source', 'exportKind'],
          ancestry: { mode: 'programParent' },
          children: {
            declaration: {
              route: 'Declaration',
              fields: ['name', 'nodeKind', 'async'],
              children: {
                declarations: {
                  route: 'VariableDeclarator',
                  children: {
                    id: { route: 'Identifier', fields: ['name'] },
                  },
                },
              },
            },
            specifiers: {
              route: 'ExportSpecifier',
              fields: ['local', 'exported', 'exportKind'],
            },
          } as any,
        },
        (exportPath, state) => {
          if (
            !state.enabled ||
            exportPath.parentPath?.node.type !== 'Program' ||
            exportPath.node.exportKind === 'type'
          )
            return;
          if (exportPath.node.source) {
            exportPath.unsupported('server-action-reexport');
          }
          const registrations: string[] = [];
          const declaration = exportPath.getChild('declaration') as any;
          if (declaration) {
            if (declaration.node.nodeKind === 'FunctionDeclaration') {
              if (declaration.node.async !== true) {
                exportPath.unsupported('server-action-non-async-function');
              }
              const name = String(declaration.node.name);
              state.actions.push({ localName: name, exportedName: name });
              registrations.push(name);
            } else if (declaration.node.type === 'VariableDeclaration') {
              for (const declarator of declaration.getChildList('declarations')) {
                const id = declarator.getChild('id');
                if (id?.node.type !== 'Identifier') {
                  exportPath.unsupported('server-action-pattern-export');
                }
                const name = String(id!.node.name);
                state.actions.push({ localName: name, exportedName: name });
                registrations.push(name);
              }
            } else if (
              declaration.node.type !== 'TSInterfaceDeclaration' &&
              declaration.node.type !== 'TSTypeAliasDeclaration'
            ) {
              exportPath.unsupported('server-action-export-kind');
            }
          }
          for (const specifier of exportPath.getChildList('specifiers')) {
            if (specifier.node.exportKind === 'type') continue;
            const localName = String(specifier.node.local);
            const exportedName = String(specifier.node.exported);
            if (!state.actions.some((action) => action.localName === localName)) {
              exportPath.insertBefore(
                `;(() => ${state.registerBinding}(${localName}, ${JSON.stringify(state.moduleId)}, ${JSON.stringify(exportedName)}))();`
              );
            }
            state.actions.push({ localName, exportedName });
          }
          if (registrations.length > 0) {
            exportPath.insertAfter(
              registrations
                .map(
                  (name) =>
                    `;(() => ${state.registerBinding}(${name}, ${JSON.stringify(state.moduleId)}, ${JSON.stringify(name)}))();`
                )
                .join('\n')
            );
          }
        }
      ),
    ],
    post(context, state) {
      if (state.actions.length === 0) return;
      const payload = {
        id: state.moduleId,
        names: state.actions.map((action) => action.exportedName),
      };
      context.editor.appendRight(
        0,
        `/* rsc/actions: ${JSON.stringify(payload)} */\nimport { registerServerReference as ${state.registerBinding} } from "react-server-dom-webpack/server";\n${
          state.usesCapturedArgs
            ? `var ${state.wrapperBinding} = (thunk) => { let cache; return { get value() { return cache || (cache = thunk()); } }; };\n`
            : ''
        }`
      );
      context.metadata.set('reactServerActions', payload);
      context.metadata.set('reactServerReference', pathToFileURL(state.input.filename).href);
    },
  });
}
