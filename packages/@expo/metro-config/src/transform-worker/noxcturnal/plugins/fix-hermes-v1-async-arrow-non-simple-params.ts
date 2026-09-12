import type { CompositeFragment, DefinedNativePlugin, SourceFragment } from 'noxcturnal';

import type { Noxcturnal } from '../noxcturnal-transformer';

export function createFixHermesV1AsyncArrowNonSimpleParamsPlugin(
  nox: Noxcturnal
): DefinedNativePlugin {
  return nox.defineNativePlugin({
    name: 'expo-fix-hermes-v1-async-arrow-non-simple-params',
    visitors: [
      nox.defineVisitor(
        'ArrowFunctionExpression',
        {
          fields: ['async', 'expression', 'parameterCount'],
          scope: true,
          children: {
            params: {
              route: 'FormalParameter|FormalParameterRest|BindingRestElement',
              children: {
                pattern: { route: 'Identifier|ObjectPattern|ArrayPattern' },
                default: { route: 'Expression' },
              },
            },
            body: { route: 'FunctionBody' },
          },
        },
        (arrow) => {
          if (!arrow.node.async) return;
          const params = arrow.getChildList('params');
          if (params.length === 0) return;
          if (
            params.every((parameter) => {
              if (parameter.node.type !== 'FormalParameter') return false;
              return (
                parameter.getChild('pattern')?.node.type === 'Identifier' &&
                !parameter.getChild('default')
              );
            })
          )
            return;

          const body = arrow.getChild('body');
          if (!body) arrow.unsupported('missing-async-arrow-body');
          const bodySource = body!.getSource();
          // Hermes rejects every rest-parameter async arrow. Keep its original
          // parameter binding in a synchronous closure and invoke a zero-argument
          // async arrow inside it, matching Expo's maintained Babel transform.
          if (
            params.some(
              (parameter) =>
                parameter.node.type === 'FormalParameterRest' ||
                parameter.node.type === 'BindingRestElement'
            )
          ) {
            const arrowSource = arrow.getSource();
            arrow.replaceWith({
              kind: 'composite',
              parts: [
                arrow.context.sourceSlice(arrowSource.start + 5, bodySource.start),
                '(async () => ',
                ...(arrow.node.expression
                  ? (['{ return ', bodySource, '; }'] as const)
                  : ([bodySource] as const)),
                ')()',
              ],
            });
            return;
          }

          const initializerParts: CompositeFragment['parts'][number][] = [];
          const replacements: {
            path: { getSource(): SourceFragment };
            temporary: string;
          }[] = [];
          for (let index = 0; index < params.length; index++) {
            const parameter = params[index]!;
            const pattern = parameter.getChild('pattern');
            const initializer = parameter.getChild('default');
            if (pattern?.node.type === 'Identifier' && !initializer) continue;
            if (!pattern) {
              arrow.unsupported('missing-async-arrow-parameter-pattern');
              return;
            }
            const temporary = arrow.scope.generateUid('p');
            replacements.push({
              path: parameter,
              temporary,
            });
            if (initializer) {
              initializerParts.push(
                'var ',
                pattern.getSource(),
                ` = ${temporary} === undefined ? `,
                initializer.getSource(),
                ` : ${temporary}; `
              );
            } else {
              initializerParts.push('var ', pattern.getSource(), ` = ${temporary}; `);
            }
          }

          const replacementBodyParts: CompositeFragment['parts'] = arrow.node.expression
            ? ['{ ', ...initializerParts, 'return ', bodySource, '; }']
            : [
                arrow.context.sourceSlice(bodySource.start, bodySource.start + 1),
                ...initializerParts,
                arrow.context.sourceSlice(bodySource.start + 1, bodySource.end),
              ];
          const arrowSource = arrow.getSource();
          const replacementParts: CompositeFragment['parts'][number][] = [];
          let cursor = arrowSource.start;
          for (const replacement of replacements) {
            const source = replacement.path.getSource();
            replacementParts.push(
              arrow.context.sourceSlice(cursor, source.start),
              replacement.temporary
            );
            cursor = source.end;
          }
          replacementParts.push(
            arrow.context.sourceSlice(cursor, bodySource.start),
            ...replacementBodyParts
          );
          arrow.replaceWith({ kind: 'composite', parts: replacementParts });
        }
      ),
    ],
  });
}
