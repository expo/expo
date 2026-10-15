import { traverse, types as t } from '@babel/core';

/** Remove imports left unused after server exports and their helpers have been stripped. */
export function pruneUnusedImports(ast: t.File) {
  traverse(ast, {
    Program(path) {
      // Constant folding may have removed the last references to an import.
      path.scope.crawl();
    },
    ImportDeclaration(path) {
      const { importKind, specifiers } = path.node;
      if (importKind === 'type' || importKind === 'typeof' || specifiers.length === 0) {
        return;
      }
      if (
        specifiers.every((specifier) => {
          if (
            t.isImportSpecifier(specifier) &&
            (specifier.importKind === 'type' || specifier.importKind === 'typeof')
          ) {
            return false;
          }
          const binding = path.scope.getBinding(specifier.local.name);
          return binding && !binding.referenced;
        })
      ) {
        path.remove();
      }
    },
  });
}
