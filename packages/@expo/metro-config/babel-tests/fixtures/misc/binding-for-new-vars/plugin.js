module.exports = function () {
  return {
    visitor: {
      Program: {
        exit(programPath) {
          // Sub-traversal to ensure runs after ESM->CJS transform
          programPath.traverse({
            ReferencedIdentifier(path) {
              if (!path.findParent(p => p.isFunction())) return;
              const varName = path.node.name;
              path.addComment(
                "leading",
                ` ${varName} ${
                  path.scope.hasBinding(varName)
                    ? "hasBinding"
                    : "no hasBinding"
                }, ${
                  path.scope.getBinding(varName)
                    ? "getBinding"
                    : "no getBinding"
                } `
              );
            },
          });
        },
      },
    },
  };
};
