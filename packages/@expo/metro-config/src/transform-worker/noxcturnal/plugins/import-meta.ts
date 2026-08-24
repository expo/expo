import type { DefinedNativePlugin } from 'noxcturnal';

import type { Noxcturnal } from '../noxcturnal-transformer';

export function createImportMetaPlugin(nox: Noxcturnal): DefinedNativePlugin {
  return nox.defineNativePlugin({
    name: 'expo-import-meta-transform',
    visitors: [
      nox.defineVisitor('MetaProperty', {}, (path) => {
        path.replaceWith(path.context.code.parseExpression('globalThis.__ExpoImportMetaRegistry'));
      }),
    ],
  });
}
