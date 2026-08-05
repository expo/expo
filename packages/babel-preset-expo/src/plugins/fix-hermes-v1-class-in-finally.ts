import type { ConfigAPI, NodePath, PluginObj } from '@babel/core';

// TODO(@kitten): Workaround for facebook/hermes 1e94fbe0e (Variable caching for legacy classes
// Remove when fix is incorporated into RN's Hermes v1 version: https://github.com/facebook/hermes/commit/1e94fbe0e
// 2026-05-09: Currently, Hermes v1 is up to date to 2025-08-29. Fix is from 2026-02-12
export function fixHermesV1ClassInFinally({
  types: t,
}: ConfigAPI & typeof import('@babel/core')): PluginObj {
  return {
    name: 'fix-hermes-v1-class-in-finally',
    visitor: {
      ClassDeclaration(path) {
        const id = path.node.id;
        if (path.node.decorators?.length || !id || !isInFinalizerScope(path)) {
          return;
        }

        const inner = t.classDeclaration(t.cloneNode(id), path.node.superClass, path.node.body, []);

        const arrow = t.arrowFunctionExpression(
          [],
          t.blockStatement([inner, t.returnStatement(t.cloneNode(id))])
        );

        path.replaceWith(
          t.variableDeclaration('var', [
            t.variableDeclarator(t.cloneNode(id), t.callExpression(arrow, [])),
          ])
        );
        path.skip();
      },

      ClassExpression(path) {
        if (path.node.decorators?.length || !isInFinalizerScope(path)) {
          return;
        }

        const arrow = t.arrowFunctionExpression([], path.node);
        path.replaceWith(t.callExpression(arrow, []));
        path.skip();
      },
    },
  };
}

function isInFinalizerScope(path: NodePath): boolean {
  let inner = path;
  let parentPath = path.parentPath;
  while (parentPath) {
    const type = parentPath.node.type;
    switch (type) {
      case 'FunctionExpression':
      case 'FunctionDeclaration':
      case 'ArrowFunctionExpression':
      case 'ObjectMethod':
      case 'ClassMethod':
      case 'ClassPrivateMethod':
      case 'StaticBlock':
        return false;
      case 'TryStatement':
        if (inner.key === 'finalizer') {
          return true;
        }
        break;
    }
    inner = parentPath;
    parentPath = parentPath.parentPath;
  }
  return false;
}
