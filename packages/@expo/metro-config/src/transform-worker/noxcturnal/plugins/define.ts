import type { DefinedNativePlugin } from 'noxcturnal';

import { expoPluginInput, isNodeModule, mappedLiteral } from '../noxcturnal-transformer';
import type { Noxcturnal } from '../noxcturnal-transformer';
import { addCacheVary } from './cache-vary';

interface DefineState {
  identifiers: Map<string, unknown>;
  members: Map<string, unknown>;
  typeofValues: Map<string, unknown>;
}

export function createDefinePlugin(nox: Noxcturnal): DefinedNativePlugin<DefineState> {
  return nox.defineNativePlugin<DefineState>({
    name: 'expo-define-globals',
    createState: (context) => {
      const input = expoPluginInput(context);
      const { options } = input;
      const environment = options.customTransformOptions?.environment;
      const isServer = environment === 'node' || environment === 'react-server';
      const identifiers = new Map<string, unknown>();
      const members = new Map<string, unknown>();
      const typeofValues = new Map<string, unknown>();
      members.set('process.env.EXPO_OS', options.platform);
      members.set(
        'process.env.EXPO_SERVER',
        environment === 'node' || environment === 'react-server'
      );
      if (!options.dev) {
        identifiers.set('__DEV__', false);
        members.set('Platform.OS', options.platform);
        members.set('process.env.NODE_ENV', 'production');
      }
      if (process.env.NODE_ENV !== 'test') {
        const baseUrl = options.customTransformOptions?.baseUrl;
        members.set(
          'process.env.EXPO_BASE_URL',
          typeof baseUrl === 'string' ? decodeURI(baseUrl) : ''
        );
      }
      if (isNodeModule(input.filename) && process.env.EXPO_PUBLIC_USE_RN_FETCH != null) {
        members.set('process.env.EXPO_PUBLIC_USE_RN_FETCH', process.env.EXPO_PUBLIC_USE_RN_FETCH);
      }
      const minifyTypeofWindow = options.customTransformOptions?.minifyTypeofWindow;
      if (String(minifyTypeofWindow ?? isServer) !== 'false') {
        typeofValues.set('window', isServer ? 'undefined' : 'object');
      }
      return { identifiers, members, typeofValues };
    },
    visitors: [
      nox.defineVisitor(
        'ReferencedIdentifier',
        {
          fields: ['name', 'global', 'read', 'write'],
          where: { name: { equals: '__DEV__' } },
        },
        (path, state: DefineState) => {
          const { identifiers } = state;
          const name = String(path.node.name);
          if (!identifiers.has(name) || path.node.global !== true || path.node.write === true) {
            return;
          }
          path.replaceWith(mappedLiteral(path.context, identifiers.get(name)));
        }
      ),
      nox.defineVisitor(
        'StaticMemberExpression|ComputedMemberExpression',
        {
          fields: ['memberPath'],
          where: {
            memberPath: {
              oneOf: [
                'Platform.OS',
                'process.env.EXPO_OS',
                'process.env.EXPO_SERVER',
                'process.env.NODE_ENV',
                'process.env.EXPO_BASE_URL',
                'process.env.EXPO_PUBLIC_USE_RN_FETCH',
              ],
            },
            write: { equals: false },
          },
          scope: true,
        },
        (path, state: DefineState) => {
          const { members } = state;
          const pattern = String(path.node.memberPath ?? '');
          if (!members.has(pattern)) return;
          const root = pattern.slice(0, pattern.indexOf('.'));
          if (path.scope.hasBinding(root)) return;
          if (pattern.startsWith('process.env.EXPO_PUBLIC_')) {
            addCacheVary(path.context, {
              scheme: 'env',
              name: pattern.slice('process.env.'.length),
            });
          }
          path.replaceWith(mappedLiteral(path.context, members.get(pattern)));
        }
      ),
      nox.defineVisitor(
        'UnaryExpression',
        {
          fields: ['operator'],
          where: { operator: { equals: 'typeof' } },
          scope: true,
          children: { argument: { route: 'Expression', fields: ['name'] } },
        },
        (path, state: DefineState) => {
          const { typeofValues } = state;
          if (path.node.operator !== 'typeof') return;
          const argument = path.getChild('argument');
          if (!argument || argument.node.type !== 'Identifier') return;
          const name = String(argument.node.name);
          if (!typeofValues.has(name) || path.scope.hasBinding(name)) return;
          path.replaceWith(mappedLiteral(path.context, typeofValues.get(name)));
        }
      ),
    ],
  });
}
