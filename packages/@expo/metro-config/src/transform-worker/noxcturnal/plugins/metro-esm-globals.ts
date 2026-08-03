import type { DefinedNativePlugin } from 'noxcturnal';

import { metroPluginData, type Noxcturnal } from '../noxcturnal-transformer';

export function createMetroEsmGlobalsPlugin(nox: Noxcturnal): DefinedNativePlugin {
  return nox.defineNativePlugin({
    name: 'metro-native-esm-pseudo-global-renames',
    visitors: [
      nox.defineVisitor('Program', { scope: true }, (program) => {
        for (const name of ['global', 'require', 'module', 'exports']) {
          if (program.scope.hasBinding(name)) {
            program.scope.rename(name, program.scope.generateUid(name));
          }
        }
      }),
      nox.defineVisitor(
        'Identifier',
        {
          fields: ['name', 'global'],
          where: { name: { oneOf: ['global', 'module', 'exports'] } },
        },
        (identifier) => {
          if (
            identifier.node.global !== true ||
            !metroPluginData(identifier.context).normalizePseudoGlobals
          ) {
            return;
          }
          const replacement = { global: 'g', module: 'm', exports: 'e' }[
            String(identifier.node.name)
          ];
          if (replacement) identifier.replaceWith(replacement);
        }
      ),
    ],
  });
}
