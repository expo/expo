import type { DefinedNativePlugin } from 'noxcturnal';

import type { Noxcturnal } from '../noxcturnal-transformer';

const INVALID_SERVER_REACT_APIS = new Set([
  'Component',
  'createContext',
  'createFactory',
  'PureComponent',
  'useDeferredValue',
  'useEffect',
  'useImperativeHandle',
  'useInsertionEffect',
  'useLayoutEffect',
  'useReducer',
  'useRef',
  'useState',
  'useSyncExternalStore',
  'useTransition',
  'useOptimistic',
]);
const INVALID_SERVER_REACT_DOM_APIS = new Set([
  'findDOMNode',
  'flushSync',
  'unstable_batchedUpdates',
  'useFormStatus',
  'useFormState',
]);

interface RestrictedReactApiState {
  named: Map<number, string>;
  namespaces: Map<number, string>;
}

export function createEnvironmentRestrictedReactApisPlugin(
  nox: Noxcturnal,
  skip: (context: { pluginData: unknown }) => boolean = () => false
): DefinedNativePlugin<RestrictedReactApiState> {
  const forbiddenFor = (source: unknown) =>
    source === 'react'
      ? INVALID_SERVER_REACT_APIS
      : source === 'react-dom'
        ? INVALID_SERVER_REACT_DOM_APIS
        : null;
  return nox.defineNativePlugin({
    name: 'expo-environment-restricted-react-apis',
    createState: () => ({ named: new Map(), namespaces: new Map() }),
    visitors: [
      nox.defineVisitor(
        'ImportDeclaration',
        {
          fields: ['source'],
          scope: true,
          children: {
            specifiers: {
              route: 'ImportSpecifier|ImportDefaultSpecifier|ImportNamespaceSpecifier',
              fields: ['local', 'imported'],
            },
          },
        },
        (importPath, state) => {
          if (skip(importPath.context)) return;
          const source = String(importPath.node.source);
          const forbidden = forbiddenFor(source);
          if (!forbidden) return;
          for (const specifier of importPath.getChildList('specifiers')) {
            const local = String(specifier.node.local);
            const binding = importPath.scope.getBinding(local);
            const declarationId = binding?.declaration?.id;
            if (declarationId == null) continue;
            if (specifier.node.type === 'ImportSpecifier') {
              const imported = String(specifier.node.imported);
              if (!forbidden.has(imported)) continue;
              if (imported === 'Component' || imported === 'PureComponent') {
                importPath.unsupported(`react-server-client-api-import:${source}:${imported}`);
              }
              state.named.set(declarationId, imported);
            } else {
              state.namespaces.set(declarationId, source);
            }
          }
        }
      ),
      nox.defineVisitor(
        'VariableDeclarator',
        {
          scope: true,
          children: {
            init: {
              route: 'CallExpression',
              children: {
                callee: { route: 'Identifier', fields: ['name'] },
              },
            },
          },
        },
        (declarator, state) => {
          if (skip(declarator.context)) return;
          const init = declarator.getChild('init');
          if (!init || init.node.type !== 'CallExpression') return;
          const callee = init.getChild('callee');
          if (!callee) return;
          const binding = declarator.scope.getBinding(String(callee.node.name));
          const api =
            binding?.declaration?.id == null ? undefined : state.named.get(binding.declaration.id);
          if (api) declarator.unsupported(`react-server-client-api-use:${api}`);
        }
      ),
      nox.defineVisitor(
        'MemberExpression',
        {
          scope: true,
          children: {
            object: { route: 'Identifier', fields: ['name'] },
            property: { route: 'Identifier', fields: ['name'] },
          },
        },
        (member, state) => {
          if (skip(member.context)) return;
          const object = member.getChild('object');
          const property = member.getChild('property');
          if (!object || !property) return;
          const binding = member.scope.getBinding(String(object.node.name));
          const source =
            binding?.declaration?.id == null
              ? undefined
              : state.namespaces.get(binding.declaration.id);
          if (!source || !forbiddenFor(source)?.has(String(property.node.name))) return;
          member.unsupported(`react-server-client-api-use:${source}:${String(property.node.name)}`);
        }
      ),
    ],
  });
}
