import type { NativeScope, PluginContext } from 'noxcturnal';

import type { Noxcturnal } from '../noxcturnal-transformer';

export function createPlatformBindingChecker(nox: Noxcturnal) {
  const scanned = new WeakSet<PluginContext>();
  const imports = new WeakMap<PluginContext, Set<number>>();
  const visitor = nox.defineVisitor(
    'ImportDeclaration',
    {
      where: { source: { oneOf: ['react-native', 'expo-modules-core', 'react-native-web'] } },
      fields: ['source', 'importKind'],
      children: {
        specifiers: { route: 'ImportSpecifier', fields: ['imported', 'importKind'] },
      },
    },
    (path) => {
      let bindings = imports.get(path.context);
      if (!bindings) imports.set(path.context, (bindings = new Set()));
      if (path.node.importKind === 'type') return;
      for (const specifier of path.getChildList('specifiers')) {
        if (specifier.node.imported === 'Platform' && specifier.node.importKind !== 'type') {
          bindings.add(specifier.id);
        }
      }
    }
  );
  const isPlatformBinding = (scope: NativeScope, context: PluginContext): boolean => {
    const binding = scope.getBinding('Platform');
    if (!binding || binding.global) return true;
    const specifierId = binding.declaration?.parentId;
    if (specifierId == null) return false;
    if (imports.get(context)?.has(specifierId)) return true;
    if (scanned.has(context)) return false;
    scanned.add(context);
    context.revisitProgram([visitor]);
    return imports.get(context)?.has(specifierId) === true;
  };
  return { isPlatformBinding, visitor };
}
