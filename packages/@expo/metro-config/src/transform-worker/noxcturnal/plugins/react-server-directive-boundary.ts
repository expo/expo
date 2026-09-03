import type { DefinedNativePlugin } from 'noxcturnal';

import { serverBoundary, type Noxcturnal } from '../noxcturnal-transformer';

export function createReactServerDirectiveBoundaryPlugin(nox: Noxcturnal): DefinedNativePlugin {
  return nox.defineNativePlugin({
    name: 'expo-react-server-directive-boundary',
    visitors: [
      nox.defineVisitor(
        'Directive',
        { fields: ['value'], ancestry: { mode: 'parent' } },
        (directive) => {
          const boundary = serverBoundary(directive.context);
          if (
            boundary.handledDirectives.has(directive.id) ||
            ((boundary.clientProxy || boundary.moduleServerActions) &&
              directive.parentPath?.node.type === 'Program')
          )
            return;
          if (directive.node.value === 'use server') {
            directive.unsupported('expo-directive');
          }
        }
      ),
    ],
  });
}
