import type { DefinedNativePlugin } from 'noxcturnal';

import type { Noxcturnal } from '../noxcturnal-transformer';

export function createPlatformSelectPlugin(
  nox: Noxcturnal,
  platform: string | null | undefined
): DefinedNativePlugin {
  return nox.defineNativePlugin({
    name: 'expo-minify-platform-select',
    visitors: [
      nox.defineVisitor(
        'CallExpression',
        {
          scope: true,
          children: {
            callee: { route: 'Expression', fields: ['memberPath', 'name'] },
            arguments: {
              route: 'ObjectExpression',
              children: {
                properties: {
                  route: 'ObjectProperty',
                  fields: ['key', 'computed'],
                  children: { value: { route: 'Expression' } },
                },
              },
            },
          },
        },
        (call) => {
          const callee = call.getChild('callee');
          if (!callee?.matchesPattern('Platform.select') || call.scope.hasBinding('Platform'))
            return;
          const argument = call.getChildList('arguments')[0];
          if (!argument?.is('ObjectExpression')) return;
          const properties = argument.getChildList('properties');
          if (
            properties.some(
              (property) =>
                property.node.type !== 'ObjectProperty' || property.node.computed === true
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
          const value = selected?.getChild('value');
          call.replaceWith(
            value ? value.getSource() : call.context.code.parseExpression('undefined')
          );
        }
      ),
    ],
  });
}
