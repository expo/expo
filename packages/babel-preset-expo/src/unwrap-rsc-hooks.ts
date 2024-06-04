/**
 * Copyright © 2024 650 Industries.
 *
 * It's not clear if React Server Components depends on this behavior, but the
 * Next.js implementation from the React team has this optimization in place:
 * https://github.com/vercel/next.js/blob/08a92e0aa589e9220b0e740594c39846c69ef308/packages/next-swc/crates/next-custom-transforms/src/transforms/optimize_server_react.rs#L1
 */
import { ConfigAPI, types } from '@babel/core';

function effectHasSideEffectDeps(call: types.CallExpression) {
  if (call.arguments.length !== 2) {
    return false;
  }

  // We can't optimize if the effect has a function call as a dependency:
  // useEffect(() => {}, x())
  if (types.isCallExpression(call.arguments[1])) {
    return true;
  }

  // As well as:
  // useEffect(() => {}, [x()])
  if (types.isArrayExpression(call.arguments[1])) {
    for (const elem of call.arguments[1].elements) {
      if (types.isCallExpression(elem)) {
        return true;
      }
    }
  }

  return false;
}

export function unwrapRscHooks(api: ConfigAPI & { types: typeof types }): babel.PluginObj {
  const { types: t } = api;
  return {
    name: 'expo-unwrap-rsc-hooks',
    visitor: {
      ImportDeclaration(path, state) {
        const { node } = path;
        if (node.source.value !== 'react') {
          return;
        }
        for (const specifier of node.specifiers) {
          if (t.isImportSpecifier(specifier)) {
            const name = specifier.imported ? specifier.imported.name : specifier.local.name;
            if (name === 'useState') {
              state.useStateIdent = specifier.local.name;
            } else if (name === 'useEffect') {
              state.useEffectIdent = specifier.local.name;
            } else if (name === 'useLayoutEffect') {
              state.useLayoutEffectIdent = specifier.local.name;
            }
          } else if (
            t.isImportDefaultSpecifier(specifier) ||
            t.isImportNamespaceSpecifier(specifier)
          ) {
            state.reactIdent = specifier.local.name;
          }
        }
      },
      CallExpression(path, state) {
        const { node } = path;
        const callee = node.callee;

        if (
          t.isIdentifier(node.callee, { name: 'useMemo' }) ||
          (t.isMemberExpression(node.callee) &&
            t.isIdentifier(node.callee.object, { name: 'React' }) &&
            t.isIdentifier(node.callee.property, { name: 'useMemo' }))
        ) {
          // Handles `useMemo(() => {}, [])`
          if (t.isArrowFunctionExpression(node.arguments[0])) {
            const arrowFunc = node.arguments[0];
            path.replaceWith(arrowFunc.body);
            return;
          }
          // Handles `useMemo(fn, [])` -> `fn()`
          else if (t.isIdentifier(node.arguments[0])) {
            const fn = node.arguments[0];
            // Ensure we invoke the function
            path.replaceWith(t.callExpression(fn, []));
            return;
          }
        }

        if (t.isIdentifier(callee)) {
          // Remove `useEffect` call
          if (
            state.useEffectIdent &&
            callee.name === state.useEffectIdent &&
            !effectHasSideEffectDeps(node)
          ) {
            path.replaceWith(t.nullLiteral());
            return;
          }
          // Remove `useLayoutEffect` call
          if (
            state.useLayoutEffectIdent &&
            callee.name === state.useLayoutEffectIdent &&
            !effectHasSideEffectDeps(node)
          ) {
            path.replaceWith(t.nullLiteral());
          }
        } else if (state.reactIdent && t.isMemberExpression(callee)) {
          const memberExpr = callee;
          if (
            t.isIdentifier(memberExpr.object) &&
            memberExpr.object.name === state.reactIdent &&
            t.isIdentifier(memberExpr.property)
          ) {
            const propName = memberExpr.property.name;
            // Remove `React.useEffect` and `React.useLayoutEffect` calls
            if (propName === 'useEffect' || propName === 'useLayoutEffect') {
              path.replaceWith(t.nullLiteral());
              //
            }
          }
        }
      },

      VariableDeclarator(path, state) {
        // Has to run before "@babel/plugin-transform-destructuring"
        const { node } = path;
        // if (!state.opts.optimizeUseState) {
        //   return;
        // }

        if (t.isArrayPattern(node.id) && node.id.elements.length === 2) {
          if (
            state.useStateIdent &&
            node.init &&
            node.init.callee &&
            t.isIdentifier(node.init.callee) &&
            node.init.callee.name === state.useStateIdent &&
            node.init.arguments.length === 1
          ) {
            const argExpr = node.init.arguments[0];
            if (
              t.isLiteral(argExpr) ||
              t.isObjectExpression(argExpr) ||
              t.isArrayExpression(argExpr)
            ) {
              path.replaceWith(
                t.variableDeclarator(
                  node.id,
                  t.arrayExpression([
                    argExpr,
                    t.arrowFunctionExpression(
                      [],
                      t.blockStatement([t.returnStatement(t.nullLiteral())])
                    ),
                  ])
                )
              );
            }
          }
        }
      },
    },
  };
}
