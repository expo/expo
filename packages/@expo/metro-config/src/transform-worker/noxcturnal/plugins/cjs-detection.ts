import type { DefinedNativePlugin } from 'noxcturnal';

import type { Noxcturnal } from '../noxcturnal-transformer';

export function createCjsDetectionPlugin(
  nox: Noxcturnal
): DefinedNativePlugin<{ hasCjsExports: boolean }> {
  return nox.defineNativePlugin<{ hasCjsExports: boolean }>({
    name: 'expo-detect-cjs-exports',
    contract: { metadata: { writes: ['hasCjsExports'] } },
    createState: () => ({ hasCjsExports: false }),
    visitors: [
      nox.defineVisitor(
        'StaticMemberExpression',
        { fields: ['memberPath'], scope: true, ancestry: { mode: 'parent' } },
        (path, state: { hasCjsExports: boolean }) => {
          if (
            path.parentPath?.node.type !== 'AssignmentExpression' ||
            path.parentPath.node.start !== path.node.start
          ) {
            return;
          }
          const pattern = String(path.node.memberPath ?? '');
          const isModuleExports =
            (pattern === 'module.exports' || pattern.startsWith('module.exports.')) &&
            !path.scope.hasBinding('module');
          const isExportsProperty =
            pattern.startsWith('exports.') && !path.scope.hasBinding('exports');
          if (isModuleExports || isExportsProperty) state.hasCjsExports = true;
        }
      ),
      nox.defineVisitor(
        'AssignmentExpression',
        {
          scope: true,
          children: { left: { route: 'Expression', fields: ['name'] } },
        },
        (path, state: { hasCjsExports: boolean }) => {
          if (state.hasCjsExports) return;
          const left = path.getChild('left');
          if (
            left?.node.type === 'Identifier' &&
            left.node.name === 'exports' &&
            !path.scope.hasBinding('exports')
          ) {
            state.hasCjsExports = true;
          }
        }
      ),
      nox.defineVisitor(
        'CallExpression',
        {
          scope: true,
          children: {
            callee: { route: 'Expression', fields: ['memberPath'] },
            arguments: { route: 'Expression', fields: ['name', 'memberPath'] },
          },
        },
        (path, state: { hasCjsExports: boolean }) => {
          if (state.hasCjsExports) return;
          const callee = path.getChild('callee');
          const args = path.getChildList('arguments');
          if (
            args.length > 1 &&
            callee?.matchesPattern('Object.assign') &&
            !path.scope.hasBinding('Object') &&
            (args[0]?.matchesPattern('module.exports') ||
              (args[0]?.node.type === 'Identifier' &&
                args[0].node.name === 'exports' &&
                !path.scope.hasBinding('exports')))
          ) {
            state.hasCjsExports = true;
          }
        }
      ),
    ],
    post(context, state) {
      context.metadata.set('hasCjsExports', state.hasCjsExports);
    },
  });
}
