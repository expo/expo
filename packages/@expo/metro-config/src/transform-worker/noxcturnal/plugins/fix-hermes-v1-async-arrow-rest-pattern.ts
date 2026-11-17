import type { DefinedNativePlugin } from 'noxcturnal';

import type { Noxcturnal } from '../noxcturnal-transformer';

// TODO(@kitten): Workaround for https://github.com/meta/hermes/issues/2260
// Remove when the fix ships in Expo's Hermes version: https://github.com/meta/hermes/pull/2261
export function createFixHermesV1AsyncArrowRestPatternPlugin(nox: Noxcturnal): DefinedNativePlugin {
  return nox.defineNativePlugin({
    name: 'expo-fix-hermes-v1-async-arrow-rest-pattern',
    contract: { syntax: { anyOf: ['ArrayPattern', 'ObjectPattern'] } },
    visitors: [
      nox.defineVisitor(
        'ArrowFunctionExpression',
        {
          where: { async: { equals: true } },
          scope: true,
          children: {
            params: {
              route: 'FormalParameter|FormalParameterRest|BindingRestElement',
              children: {
                argument: {
                  route: 'BindingRestElement',
                  children: { pattern: { route: 'Identifier|ArrayPattern|ObjectPattern' } },
                },
                pattern: { route: 'Identifier|ArrayPattern|ObjectPattern' },
                default: { route: 'Expression' },
              },
            },
          },
        },
        (arrow) => {
          const params = arrow.getChildList('params');
          const rest = params.at(-1);
          if (!rest) return;
          const binding =
            rest.node.type === 'FormalParameterRest'
              ? rest.getChild('argument')
              : rest.node.type === 'BindingRestElement'
                ? rest
                : undefined;
          const pattern = binding?.getChild('pattern');
          if (pattern?.node.type !== 'ArrayPattern' && pattern?.node.type !== 'ObjectPattern') {
            return;
          }

          const fixedParams = params.slice(0, -1);
          const args = fixedParams.map(() => arrow.scope.generateUid('arg'));
          const defaultIndex = fixedParams.findIndex((param) => param.getChild('default'));
          const newParams = args.map((arg, index) =>
            index === defaultIndex ? `${arg} = void 0` : arg
          );
          const restArgs = arrow.scope.generateUid('rest');
          newParams.push(`...${restArgs}`);
          args.push(restArgs);
          const source = arrow.getSource();
          const restSource = rest.getSource();
          arrow.replaceWith({
            kind: 'composite',
            parts: [
              `(${newParams.join(', ')}) => (`,
              arrow.context.sourceSlice(source.start, restSource.start),
              pattern.getSource(),
              arrow.context.sourceSlice(restSource.end, source.end),
              `)(${args.join(', ')})`,
            ],
          });
        }
      ),
    ],
  });
}
