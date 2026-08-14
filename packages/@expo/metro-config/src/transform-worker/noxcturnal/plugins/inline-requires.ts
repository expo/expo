import type { DefinedNativePlugin, NativeBinding } from 'noxcturnal';

import { expoPluginData } from '../noxcturnal-transformer';
import type { Noxcturnal } from '../noxcturnal-transformer';

interface InlineRequiresBindingFacts {
  declarationId: number | undefined;
  references: NativeBinding['references'];
  unsafe: boolean;
}

interface InlineRequiresState {
  ignored: ReadonlySet<string>;
  bindings: Map<string, InlineRequiresBindingFacts | null>;
}

export function createInlineRequiresPlugin(
  nox: Noxcturnal
): DefinedNativePlugin<InlineRequiresState> {
  return nox.defineNativePlugin<InlineRequiresState>({
    name: 'metro-inline-requires',
    editEffect: 'bindings',
    createState(context) {
      const { input } = expoPluginData(context);
      return {
        ignored: new Set(input.options.nonInlinedRequires ?? []),
        bindings: new Map(),
      };
    },
    visitors: [
      nox.defineVisitor(
        'VariableDeclaration',
        {
          fields: ['kind'],
          ancestry: { mode: 'parent' },
          scope: true,
          children: {
            declarations: {
              route: 'VariableDeclarator',
              children: {
                id: { route: 'Identifier', fields: ['name'] },
                init: {
                  route: 'CallExpression|StaticMemberExpression|ComputedMemberExpression',
                  fields: ['calleeName', 'calleeGlobal', 'staticArgument', 'argumentCount'],
                  children: {
                    object: {
                      route: 'CallExpression',
                      fields: ['calleeName', 'calleeGlobal', 'staticArgument', 'argumentCount'],
                    },
                  },
                },
              },
            },
          } as any,
        },
        (declaration, state) => {
          if (declaration.parentPath?.node.type !== 'Program') return;
          const declarators = declaration.getChildList('declarations');
          const retained: (typeof declarators)[number][] = [];
          const replacements: { start: number; end: number; code: string }[] = [];

          for (const declaratorPath of declarators) {
            // The nested union route is valid at runtime, but the public child-path
            // inference cannot currently retain its named children through `any`.
            const declarator = declaratorPath as typeof declaratorPath & {
              getChild(role: 'id' | 'init'): any;
            };
            const id = declarator.getChild('id');
            const init = declarator.getChild('init');
            if (id?.node.type !== 'Identifier' || !init) {
              retained.push(declarator);
              continue;
            }
            const call =
              init.node.type === 'CallExpression'
                ? init
                : init.node.type === 'StaticMemberExpression' ||
                    init.node.type === 'ComputedMemberExpression'
                  ? init.getChild('object')
                  : undefined;
            const inlineable =
              call?.node.type === 'CallExpression' &&
              call.node.calleeName === 'require' &&
              call.node.calleeGlobal === true &&
              call.node.argumentCount === 1 &&
              typeof call.node.staticArgument === 'string'
                ? { moduleName: call.node.staticArgument }
                : undefined;
            if (
              !inlineable ||
              state.ignored.has(inlineable.moduleName) ||
              inlineable.moduleName.startsWith('@babel/runtime/')
            ) {
              retained.push(declarator);
              continue;
            }
            const name = String(id.node.name);
            let binding = state.bindings.get(name);
            if (binding === undefined) {
              const resolved = declaration.scope.getBinding(name);
              binding = resolved
                ? {
                    declarationId: resolved.declaration?.id,
                    references: resolved.references,
                    unsafe: resolved.references.some(
                      (reference) => reference.write || reference.memberWrite
                    ),
                  }
                : null;
              state.bindings.set(name, binding);
            }
            if (!binding || binding.declarationId !== id.id) {
              retained.push(declarator);
              continue;
            }
            if (binding.unsafe) {
              retained.push(declarator);
              continue;
            }
            const code = init.sourceText();
            for (const reference of binding.references) {
              replacements.push({
                start: reference.start,
                end: reference.end,
                code,
              });
            }
          }

          if (retained.length === declarators.length) return;
          for (const replacement of replacements) {
            declaration.context.editor.overwrite(
              replacement.start,
              replacement.end,
              replacement.code
            );
          }
          if (retained.length === 0) {
            declaration.remove();
          } else {
            declaration.replaceWith(
              `${String(declaration.node.kind)} ${retained
                .map((declarator) => declarator.sourceText())
                .join(', ')};`
            );
          }
        }
      ),
    ],
  });
}
