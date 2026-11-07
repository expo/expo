import type { ConfigAPI, NodePath, PluginObj, PluginPass, types as BabelTypes } from '@babel/core';

// TODO(@kitten): Workaround for https://github.com/meta/hermes/issues/2260
// Remove when the fix ships in Expo's Hermes version: https://github.com/meta/hermes/pull/2261
export function fixHermesV1AsyncArrowRestPattern({
  types: t,
  template,
}: ConfigAPI & typeof import('@babel/core')): PluginObj {
  function getBindingParameters(
    path: NodePath<BabelTypes.ArrowFunctionExpression>,
    state: PluginPass
  ) {
    const last = path.node.params.at(-1) as BabelTypes.Node | undefined;
    const rest = t.isTypeCastExpression(last) ? last.expression : last;
    if (
      !t.isSpreadElement(rest) ||
      (!t.isArrayExpression(rest.argument) && !t.isObjectExpression(rest.argument))
    ) {
      return path.node.params;
    }

    // NOTE(@kitten): Reparse conditional arrow parameters left as expressions by Babel's Flow parser.
    const source = path
      .get('params')
      .map((param) => param.getSource())
      .join(', ');
    const arrow = template.expression.ast(`(${source}) => {}`, {
      plugins: state.file.opts.parserOpts?.plugins,
    }) as BabelTypes.ArrowFunctionExpression;
    return arrow.params;
  }

  return {
    name: 'fix-hermes-v1-async-arrow-rest-pattern',
    visitor: {
      ArrowFunctionExpression(path, state) {
        const { node } = path;
        if (!node.async) return;
        const params = getBindingParameters(path, state);
        const rest = params.at(-1);
        if (
          !t.isRestElement(rest) ||
          (!t.isArrayPattern(rest.argument) && !t.isObjectPattern(rest.argument))
        ) {
          return;
        }

        const fixedParams = params.slice(0, -1);
        const args = fixedParams.map(() => path.scope.generateUidIdentifier('arg'));
        const defaultIndex = fixedParams.findIndex((param) => t.isAssignmentPattern(param));
        const newParams = args.map((arg, index) =>
          index === defaultIndex
            ? t.assignmentPattern(t.cloneNode(arg), t.unaryExpression('void', t.numericLiteral(0)))
            : t.cloneNode(arg)
        );
        const restArgs = path.scope.generateUidIdentifier('rest');
        const inner = t.arrowFunctionExpression([...fixedParams, rest.argument], node.body, true);
        path.replaceWith(
          t.arrowFunctionExpression(
            [...newParams, t.restElement(restArgs)],
            t.callExpression(inner, [...args, t.cloneNode(restArgs)])
          )
        );
      },
    },
  };
}
