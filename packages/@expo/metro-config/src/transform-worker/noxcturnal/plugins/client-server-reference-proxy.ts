import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { DefinedNativePlugin } from 'noxcturnal';

import {
  expoPluginInput,
  serverBoundary,
  type Noxcturnal,
  type NoxcturnalTransformInput,
  type ServerBoundaryShared,
} from '../noxcturnal-transformer';

interface ClientServerProxyState {
  input: NoxcturnalTransformInput;
  boundary: ServerBoundaryShared;
  enabled: boolean;
  exports: Set<string>;
}

export function createClientServerReferenceProxyPlugin(
  nox: Noxcturnal
): DefinedNativePlugin<ClientServerProxyState> {
  return nox.defineNativePlugin<ClientServerProxyState>({
    name: 'expo-client-server-reference-proxy',
    editEffect: 'bindings',
    contract: {
      metadata: { writes: ['proxyExports', 'reactServerReference'] },
    },
    createState: (context) => {
      const boundary = serverBoundary(context);
      boundary.serverProxy = false;
      return {
        input: expoPluginInput(context),
        boundary,
        enabled: false,
        exports: new Set(),
      };
    },
    visitors: [
      nox.defineVisitor(
        'Program',
        {
          children: {
            directives: { route: 'Directive', fields: ['value'] },
          },
        },
        (program, state) => {
          state.enabled = program
            .getChildList('directives')
            .some((directive) => directive.node.value === 'use server');
          state.boundary.serverProxy = state.enabled;
        }
      ),
      nox.defineVisitor(
        'AssignmentExpression',
        {
          children: {
            left: {
              route: 'MemberExpression',
              fields: ['memberPath'],
            },
          },
        },
        (assignment, state) => {
          if (!state.enabled) return;
          const member = String(assignment.getChild('left')?.node.memberPath ?? '');
          if (
            member === 'module' ||
            member.startsWith('module.') ||
            member === 'exports' ||
            member.startsWith('exports.')
          ) {
            assignment.unsupported('server-reference-commonjs-assignment');
          }
        }
      ),
      nox.defineVisitor(
        'CallExpression',
        {
          children: {
            callee: { route: 'Expression', fields: ['memberPath'] },
          },
        },
        (call, state) => {
          if (!state.enabled) return;
          const callee = String(call.getChild('callee')?.node.memberPath ?? '');
          if (callee === 'Object.assign' || callee === 'exports.assign') {
            call.unsupported('server-reference-commonjs-assignment');
          }
        }
      ),
      nox.defineVisitor(
        'ExportDefaultDeclaration',
        { ancestry: { mode: 'programParent' } },
        (exportPath, state) => {
          if (state.enabled && exportPath.parentPath?.node.type === 'Program') {
            state.exports.add('default');
          }
        }
      ),
      nox.defineVisitor(
        'ExportAllDeclaration',
        { ancestry: { mode: 'programParent' } },
        (exportPath, state) => {
          if (state.enabled && exportPath.parentPath?.node.type === 'Program') {
            exportPath.unsupported('server-reference-export-all');
          }
        }
      ),
      nox.defineVisitor(
        'ExportNamedDeclaration',
        {
          ancestry: { mode: 'programParent' },
          children: {
            declaration: {
              route: 'Declaration',
              fields: ['name', 'nodeKind'],
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
              fields: ['exported'],
            },
          } as any,
        },
        (exportPath, state) => {
          if (!state.enabled || exportPath.parentPath?.node.type !== 'Program') return;
          const declaration = exportPath.getChild('declaration') as any;
          if (typeof declaration?.node.name === 'string') {
            state.exports.add(declaration.node.name);
          } else if (declaration?.node.type === 'VariableDeclaration') {
            for (const declarator of declaration.getChildList('declarations')) {
              const id = declarator.getChild('id');
              if (id?.node.type === 'Identifier') {
                state.exports.add(String(id.node.name));
              }
            }
          }
          for (const specifier of exportPath.getChildList('specifiers')) {
            state.exports.add(String(specifier.node.exported));
          }
        }
      ),
    ],
    post(context, state) {
      if (!state.enabled) return;
      const outputKey =
        './' +
        path.relative(state.input.projectRoot, state.input.filename).split(path.sep).join('/');
      const exports = [...state.exports];
      const proxy = [
        `import { createServerReference } from "react-server-dom-webpack/client";`,
        `import { callServerRSC } from "expo-router/rsc/internal";`,
      ];
      for (const exportName of exports) {
        const reference = `createServerReference(${JSON.stringify(`${outputKey}#${exportName}`)}, callServerRSC)`;
        proxy.push(
          exportName === 'default'
            ? `export default ${reference};`
            : `export const ${exportName} = ${reference};`
        );
      }
      context.editor.overwrite(0, context.source.length, proxy.join('\n'), 'sourceless');
      context.metadata.set('proxyExports', exports);
      context.metadata.set('reactServerReference', pathToFileURL(state.input.filename).href);
    },
  });
}
