import type { DefinedNativePlugin } from 'noxcturnal';

import type { Noxcturnal } from '../noxcturnal-transformer';
import { createPlatformBindingChecker } from './platform-binding';

export function createPlatformSelectPlugin(
  nox: Noxcturnal,
  platform: string | null | undefined
): DefinedNativePlugin {
  const { isPlatformBinding, visitor } = createPlatformBindingChecker(nox);
  return nox.defineNativePlugin({
    name: 'expo-minify-platform-select',
    contract: { syntax: { anyOf: ['CallExpression'] } },
    visitors: [
      visitor,
      nox.defineVisitor(
        {
          route: 'CallExpression',
          where: { calleePath: { equals: 'Platform.select' } },
          children: { arguments: { route: 'ObjectExpression' } },
        },
        {
          scope: true,
          controlFlow: ['dynamic-subscriptions', 'skip'],
          children: {
            callee: { route: 'Expression', fields: ['memberPath', 'name'] },
            arguments: {
              route: 'ObjectExpression',
              children: {
                properties: {
                  route: 'ObjectProperty',
                  fields: ['key', 'computed', 'method', 'kind'],
                  children: { value: { route: 'Expression' } },
                },
              },
            },
          },
        },
        (call) => {
          const callee = call.getChild('callee');
          if (
            !callee?.matchesPattern('Platform.select') ||
            !isPlatformBinding(call.scope, call.context)
          )
            return;
          const argument = call.getChildList('arguments')[0];
          if (!argument?.is('ObjectExpression')) return;
          const properties = argument.getChildList('properties');
          if (
            properties.some(
              (property) =>
                property.node.type !== 'ObjectProperty' ||
                property.node.computed === true ||
                property.node.method === true ||
                property.node.kind !== 'init'
            )
          ) {
            return;
          }
          const find = (key: string) => {
            for (let index = properties.length - 1; index >= 0; index--) {
              const property = properties[index]!;
              if (String(property.node.key) === key) return property;
            }
            return undefined;
          };
          const selected =
            (platform ? find(platform) : undefined) ??
            (platform === 'web' ? undefined : find('native')) ??
            find('default');
          for (const property of properties) {
            if (property !== selected) property.skip();
          }
          const value = selected?.getChild('value');
          call.replaceWith(
            value
              ? value.is('Identifier') ||
                value.is('StringLiteral') ||
                value.is('BooleanLiteral') ||
                value.is('NullLiteral')
                ? value.getSource()
                : call.context.code.template`(${value.getSource()})`
              : call.context.code.parseExpression('undefined')
          );
        }
      ),
    ],
  });
}
