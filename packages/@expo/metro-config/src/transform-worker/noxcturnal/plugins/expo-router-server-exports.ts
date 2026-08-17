import type { DefinedNativePlugin } from 'noxcturnal';
import path from 'path';

import {
  expoPluginInput,
  type Noxcturnal,
  type NoxcturnalTransformInput,
} from '../noxcturnal-transformer';

interface ExpoRouterExportState {
  input: NoxcturnalTransformInput;
  isLoaderBundle: boolean;
  isServer: boolean;
  loaderReference?: string;
  performConstantFolding: boolean;
}

export function createExpoRouterServerExportsPlugin(
  nox: Noxcturnal
): DefinedNativePlugin<ExpoRouterExportState> {
  return nox.defineNativePlugin<ExpoRouterExportState>({
    name: 'expo-router-server-exports',
    editEffect: 'bindings',
    contract: {
      metadata: { writes: ['loaderReference', 'performConstantFolding'] },
    },
    createState: (context) => {
      const input = expoPluginInput(context);
      return {
        input,
        isLoaderBundle: String(input.options.customTransformOptions?.isLoaderBundle) === 'true',
        isServer: input.options.customTransformOptions?.environment === 'node',
        performConstantFolding: false,
      };
    },
    visitors: [
      nox.defineVisitor('ExportDefaultDeclaration', {}, (exportPath, state) => {
        if (!state.isLoaderBundle) return;
        exportPath.remove();
        state.performConstantFolding = true;
      }),
      nox.defineVisitor(
        'ExportNamedDeclaration',
        {
          fields: ['source', 'exportKind'],
          children: {
            declaration: {
              route: 'FunctionDeclaration|VariableDeclaration',
              fields: ['nodeKind', 'name', 'kind'],
              children: {
                declarations: {
                  route: 'VariableDeclarator',
                  children: {
                    id: {
                      route: 'Identifier|ObjectPattern|ArrayPattern',
                      fields: ['name'],
                    },
                  },
                },
              },
            },
            specifiers: { route: 'ExportSpecifier' },
          },
        },
        (exportPath, state) => {
          if (
            exportPath.node.source ||
            (exportPath.node.exportKind && exportPath.node.exportKind !== 'value') ||
            exportPath.getChildList('specifiers').length > 0
          ) {
            return;
          }
          const declaration = exportPath.getChild('declaration');
          if (!declaration) return;
          if (declaration.node.type === 'Function') {
            const name = declaration.node.name;
            if (typeof name !== 'string') {
              throw declaration.buildCodeFrameError(
                'FunctionDeclaration route omitted its parsed declaration name'
              );
            }
            if (name === 'loader') {
              state.loaderReference = path.resolve(state.input.projectRoot, state.input.filename);
            }
            const remove = state.isLoaderBundle
              ? name !== 'loader'
              : name === 'loader' || (!state.isServer && name === 'generateMetadata');
            if (remove) {
              exportPath.remove();
              state.performConstantFolding = true;
            }
            return;
          }
          if (declaration.node.type !== 'VariableDeclaration') return;
          const declarators = declaration.getChildList('declarations');
          const retained = declarators.filter((declarator) => {
            const id = declarator.getChild('id');
            const name = id?.node.type === 'Identifier' ? id.node.name : undefined;
            if (name === 'loader') {
              state.loaderReference = path.resolve(state.input.projectRoot, state.input.filename);
            }
            return state.isLoaderBundle
              ? name === 'loader'
              : name !== 'loader' && (state.isServer || name !== 'generateMetadata');
          });
          if (retained.length === declarators.length) return;
          state.performConstantFolding = true;
          if (retained.length === 0) {
            exportPath.remove();
          } else {
            const kind = declaration.node.kind;
            if (typeof kind !== 'string') {
              throw declaration.buildCodeFrameError(
                'VariableDeclaration route omitted its parsed declaration kind'
              );
            }
            exportPath.replaceWith({
              kind: 'composite',
              parts: [
                `export ${kind} `,
                ...retained.flatMap((declarator, index) => [
                  ...(index === 0 ? [] : [', ']),
                  declarator.getSource(),
                ]),
                ';',
              ],
            });
          }
        }
      ),
    ],
    post(context, state) {
      if (state.loaderReference) {
        context.metadata.set('loaderReference', state.loaderReference);
      }
      if (state.performConstantFolding) {
        context.metadata.set('performConstantFolding', true);
      }
    },
  });
}
