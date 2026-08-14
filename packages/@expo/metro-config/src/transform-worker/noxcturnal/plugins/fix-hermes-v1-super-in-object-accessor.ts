import type { DefinedNativePlugin } from 'noxcturnal';

import type { Noxcturnal } from '../noxcturnal-transformer';

export function createFixHermesV1SuperInObjectAccessorPlugin(
  nox: Noxcturnal
): DefinedNativePlugin<Set<number>> {
  const superAncestry = {
    ancestry: {
      mode: 'findParent',
      routes: {
        'StaticMemberExpression|ComputedMemberExpression': {
          children: { object: { route: 'Expression|Super' } },
        },
      },
    },
  } as const;
  return nox.defineNativePlugin<Set<number>>({
    name: 'expo-fix-hermes-v1-super-in-object-accessor',
    createState: () => new Set(),
    visitors: [
      nox.defineVisitor(
        'ObjectProperty',
        {
          fields: ['kind', 'computed', 'key'],
          controlFlow: ['nested-traverse'],
          nested: [nox.defineVisitor('Super', superAncestry, () => {})],
          children: { key: { route: 'Expression' } },
        },
        (accessor, rewritten: Set<number>) => {
          if (
            accessor.node.computed ||
            (accessor.node.kind !== 'get' && accessor.node.kind !== 'set') ||
            typeof accessor.node.key !== 'string'
          ) {
            return;
          }
          const key = accessor.getChild('key');
          if (!key || (key.node.type !== 'Identifier' && key.node.type !== 'StringLiteral')) {
            return;
          }
          accessor.traverse([
            nox.defineVisitor('Super', superAncestry, (superPath) => {
              const member = superPath.parentPath;
              if (
                !member ||
                (member.node.type !== 'StaticMemberExpression' &&
                  member.node.type !== 'ComputedMemberExpression') ||
                member.getChild('object')?.id !== superPath.id
              ) {
                return;
              }

              let parent = member.parentPath;
              while (parent && parent.id !== accessor.id) {
                if (
                  parent.node.type === 'Class' ||
                  parent.node.type === 'MethodDefinition' ||
                  (parent.node.type === 'Function' && parent.parentPath?.id !== accessor.id) ||
                  parent.node.type === 'StaticBlock' ||
                  parent.node.type === 'PropertyDefinition' ||
                  parent.node.type === 'AccessorProperty' ||
                  parent.node.type === 'ObjectProperty'
                ) {
                  return;
                }
                parent = parent.parentPath;
              }
              if (!parent || rewritten.has(accessor.id)) return;
              rewritten.add(accessor.id);
              key.replaceWith(`[${JSON.stringify(accessor.node.key)}]`);
            }),
          ]);
        }
      ),
    ],
  });
}
