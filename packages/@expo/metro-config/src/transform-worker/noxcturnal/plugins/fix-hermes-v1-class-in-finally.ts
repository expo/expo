import type { DefinedNativePlugin } from 'noxcturnal';
import { isFunctionType } from 'noxcturnal';

import type { Noxcturnal } from '../noxcturnal-transformer';

export function createFixHermesV1ClassInFinallyPlugin(
  nox: Noxcturnal
): DefinedNativePlugin<Set<number>> {
  return nox.defineNativePlugin<Set<number>>({
    name: 'expo-fix-hermes-v1-class-in-finally',
    createState: () => new Set(),
    visitors: [
      nox.defineVisitor(
        'TryStatement',
        {
          controlFlow: ['nested-traverse'],
          nested: [
            nox.defineVisitor(
              'Class',
              {
                fields: ['nodeKind', 'name'],
                ancestry: { mode: 'findParent' },
              },
              () => {}
            ),
          ],
          children: { finalizer: { route: 'BlockStatement' } },
        },
        (statement, rewritten: Set<number>) => {
          const finalizer = statement.getChild('finalizer');
          if (!finalizer) return;
          finalizer.traverse([
            nox.defineVisitor(
              'Class',
              {
                fields: ['nodeKind', 'name'],
                ancestry: { mode: 'findParent' },
              },
              (classPath) => {
                if (rewritten.has(classPath.id)) return;
                let parent = classPath.parentPath;
                while (parent && parent.id !== finalizer.id) {
                  if (
                    isFunctionType(parent.node.type) ||
                    parent.node.type === 'ObjectProperty' ||
                    parent.node.type === 'MethodDefinition' ||
                    parent.node.type === 'StaticBlock' ||
                    parent.node.type === 'Class'
                  ) {
                    return;
                  }
                  parent = parent.parentPath;
                }
                if (!parent) return;
                rewritten.add(classPath.id);

                const source = classPath.getSource();
                if (classPath.node.nodeKind === 'ClassDeclaration') {
                  const name = classPath.node.name;
                  if (!name) return;
                  classPath.replaceWith(
                    classPath.context.code
                      .template`var ${name} = (() => { ${source} return ${name}; })();`
                  );
                } else {
                  classPath.replaceWith(classPath.context.code.template`(() => ${source})()`);
                }
              }
            ),
          ]);
        }
      ),
    ],
  });
}
