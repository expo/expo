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

interface ReactClientProxyState {
  input: NoxcturnalTransformInput;
  boundary: ServerBoundaryShared;
  enabled: boolean;
  mockConsolePolyfill: boolean;
  server: boolean;
  exports: Set<string>;
}

export function createReactServerClientProxyPlugin(
  nox: Noxcturnal
): DefinedNativePlugin<ReactClientProxyState> {
  return nox.defineNativePlugin<ReactClientProxyState>({
    name: 'expo-react-server-client-proxy',
    editEffect: 'bindings',
    contract: {
      metadata: { writes: ['proxyExports', 'reactClientReference'] },
    },
    createState: (context) => {
      const boundary = serverBoundary(context);
      boundary.clientProxy = false;
      boundary.moduleServerActions = false;
      boundary.handledDirectives.clear();
      return {
        input: expoPluginInput(context),
        boundary,
        enabled: false,
        mockConsolePolyfill: false,
        server: false,
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
          const directives = new Set(
            program.getChildList('directives').map((directive) => String(directive.node.value))
          );
          state.enabled = directives.has('use client') || directives.has('use dom');
          state.mockConsolePolyfill =
            state.enabled &&
            (state.input.filename.endsWith('@react-native/js-polyfills/console.js') ||
              state.input.filename.endsWith('@react-native\\js-polyfills\\console.js'));
          state.server = directives.has('use server');
          state.boundary.clientProxy = state.enabled;
          if (state.enabled && state.server) {
            program.unsupported('conflicting-client-server-directives');
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
        'ExportNamedDeclaration',
        {
          fields: ['exportKind'],
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
              fields: ['exported', 'exportKind'],
            },
          } as any,
        },
        (exportPath, state) => {
          if (!state.enabled || exportPath.parentPath?.node.type !== 'Program') return;
          if (exportPath.node.exportKind === 'type') return;
          const declaration = exportPath.getChild('declaration') as any;
          if (
            declaration?.node.type === 'TSInterfaceDeclaration' ||
            declaration?.node.type === 'TSTypeAliasDeclaration' ||
            declaration?.node.type === 'TypeAlias' ||
            declaration?.node.type === 'InterfaceDeclaration'
          ) {
            return;
          }
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
            if (specifier.node.exportKind === 'type') continue;
            state.exports.add(String(specifier.node.exported));
          }
        }
      ),
    ],
    post(context, state) {
      if (!state.enabled) return;
      if (state.mockConsolePolyfill) {
        const shebang = context.source.match(/^#![^\r\n]*(?:\r?\n|$)/)?.[0] ?? '';
        // Emptying the module leaves nothing that traces back to it.
        context.editor.overwrite(0, context.source.length, shebang, 'sourceless');
        return;
      }
      const outputKey =
        './' +
        path.relative(state.input.projectRoot, state.input.filename).split(path.sep).join('/');
      const exports = [...state.exports];
      const proxy = [
        `const proxy = /*@__PURE__*/ require("react-server-dom-webpack/server").createClientModuleProxy(${JSON.stringify(outputKey)});`,
        'module.exports = proxy;',
      ];
      for (const exportName of exports) {
        if (exportName === '*') continue;
        const message =
          exportName === 'default'
            ? `Attempted to call the default export of ${state.input.filename} from the server but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.`
            : `Attempted to call ${exportName}() of ${state.input.filename} from the server but ${exportName} is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.`;
        const registered = `require("react-server-dom-webpack/server").registerClientReference(function () { throw new Error(${JSON.stringify(message)}); }, ${JSON.stringify(outputKey)}, ${JSON.stringify(exportName)})`;
        proxy.push(
          exportName === 'default'
            ? `export default ${registered};`
            : `export const ${exportName} = ${registered};`
        );
      }
      const shebang = context.source.match(/^#![^\r\n]*(?:\r?\n|$)/)?.[0] ?? '';
      context.editor.overwrite(0, context.source.length, shebang + proxy.join('\n'), 'sourceless');
      context.metadata.set('proxyExports', exports);
      context.metadata.set('reactClientReference', pathToFileURL(state.input.filename).href);
    },
  });
}
