import type { DefinedNativePlugin } from 'noxcturnal';

import { serverBoundary, type Noxcturnal } from '../noxcturnal-transformer';

export function createClientServerDirectiveBoundaryPlugin(nox: Noxcturnal): DefinedNativePlugin {
  return nox.defineNativePlugin({
    name: 'expo-client-server-directive-boundary',
    visitors: [
      nox.defineVisitor(
        'Directive',
        { fields: ['value'], ancestry: { mode: 'parent' } },
        (directive) => {
          if (
            directive.node.value === 'use server' &&
            !(
              serverBoundary(directive.context).serverProxy &&
              directive.parentPath?.node.type === 'Program'
            )
          ) {
            directive.unsupported('expo-directive');
          }
        }
      ),
    ],
  });
}
