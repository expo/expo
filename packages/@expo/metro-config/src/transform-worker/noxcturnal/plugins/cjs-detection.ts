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
        { route: 'AssignmentExpression', children: { left: { route: 'StaticMemberExpression' } } },
        {
          scope: true,
          children: { left: { route: 'StaticMemberExpression', fields: ['memberPath'] } },
        },
        (path, state: { hasCjsExports: boolean }) => {
          const left = path.getChild('left');
          if (left == null) return;
          const pattern = String(left.node.memberPath ?? '');
          const isModuleExports =
            (pattern === 'module.exports' || pattern.startsWith('module.exports.')) &&
            !path.scope.hasBinding('module');
          const isExportsProperty =
            pattern.startsWith('exports.') && !path.scope.hasBinding('exports');
          if (isModuleExports || isExportsProperty) state.hasCjsExports = true;
        }
      ),
      nox.defineVisitor(
        {
          route: 'AssignmentExpression',
          children: {
            left: {
              route: 'Identifier',
              where: { name: { equals: 'exports' }, global: { equals: true } },
            },
          },
        },
        {},
        (_path, state: { hasCjsExports: boolean }) => {
          state.hasCjsExports = true;
        }
      ),
      ...(['identifier', 'member'] as const).map((target) =>
        nox.defineVisitor(
          {
            route: 'CallExpression',
            where: {
              calleePath: { equals: 'Object.assign' },
              calleeGlobal: { equals: true },
            },
            children: {
              callee: {
                route: 'StaticMemberExpression|ComputedMemberExpression',
              },
              arguments:
                target === 'identifier'
                  ? {
                      route: 'Identifier',
                      index: 0,
                      where: { name: { equals: 'exports' }, global: { equals: true } },
                    }
                  : {
                      route: 'StaticMemberExpression|ComputedMemberExpression',
                      index: 0,
                      where: { memberPath: { equals: 'module.exports' } },
                    },
            },
          },
          { fields: ['argumentCount'] },
          (path, state: { hasCjsExports: boolean }) => {
            if (path.node.argumentCount! > 1) state.hasCjsExports = true;
          }
        )
      ),
    ],
    post(context, state) {
      context.metadata.set('hasCjsExports', state.hasCjsExports);
    },
  });
}
