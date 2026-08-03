import type { DefinedNativePlugin } from 'noxcturnal';

import type { Noxcturnal } from '../noxcturnal-transformer';

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
    ],
  });
}
