import type { ConfigAPI, PluginObj, types as BabelTypes } from '@babel/core';
import * as generator from '@babel/generator';

// TODO(@kitten): Workaround for facebook/hermes#1761
// Remove when fix is incorporated into RN's Hermes v1 version: https://github.com/facebook/hermes/commit/68bfb3a48b31a19ac904ce6d3174ab2698ffc5e9
// 2026-05-09: Currently, Hermes v1 is up to date to 2025-08-29. Fix is from 2025-09-11
export function fixHermesV1AsyncArrowNonSimpleParams({
  types: t,
  template,
}: ConfigAPI & typeof import('@babel/core')): PluginObj {
  return {
    name: 'fix-hermes-v1-async-arrow-non-simple-params',
    visitor: {
      ArrowFunctionExpression(path) {
        const { node } = path;
        if (!node.async || node.params.every((p) => t.isIdentifier(p))) {
          return;
        }

        // @babel/parser's `flow` plugin doesn't convert the params of an arrow with a block body in a
        // conditional consequent to patterns, e.g. `...r` is left as a `SpreadElement` and `{ a }`
        // as an `ObjectExpression`. Re-parse them as arrow params to have Babel convert them
        if (node.params.some((p) => !t.isIdentifier(p) && !t.isPattern(p) && !t.isRestElement(p))) {
          const params = node.params.map((p) => generator.generate(p).code).join(', ');
          const arrow = template.expression.ast(`(${params}) => {}`, {
            plugins: this.file.opts.parserOpts?.plugins,
            preserveComments: true,
          }) as BabelTypes.ArrowFunctionExpression;
          node.params = arrow.params;
          path.scope.crawl();
        }

        // Hermes v1 rejects any rest param on async arrows
        // Bail with wrapping sync arrow function closing over async arrow function
        if (node.params.some((p) => t.isRestElement(p))) {
          const body = !t.isBlockStatement(node.body)
            ? t.blockStatement([t.returnStatement(node.body)])
            : node.body;
          const innerAsync = t.arrowFunctionExpression([], body, true);
          node.async = false;
          node.body = t.callExpression(innerAsync, []);
          return;
        }

        const newParams = [];
        const init = [];
        for (let idx = 0; idx < node.params.length; idx++) {
          const param = node.params[idx]!;
          if (t.isIdentifier(param)) {
            newParams.push(param);
            continue;
          }

          const sym = path.scope.generateUidIdentifier('p');
          if (t.isAssignmentPattern(param)) {
            newParams.push(sym);
            init.push(
              t.variableDeclaration('var', [
                t.variableDeclarator(
                  param.left,
                  t.conditionalExpression(
                    t.binaryExpression('===', t.cloneNode(sym), t.identifier('undefined')),
                    param.right,
                    t.cloneNode(sym)
                  )
                ),
              ])
            );
          } else {
            newParams.push(sym);
            init.push(
              t.variableDeclaration('var', [t.variableDeclarator(param, t.cloneNode(sym))])
            );
          }
        }

        const body = !t.isBlockStatement(node.body)
          ? t.blockStatement([t.returnStatement(node.body)])
          : node.body;
        body.body.unshift(...init);
        node.params = newParams;
        node.body = body;
      },
    },
  };
}
