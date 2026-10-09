import type { DefinedNativePlugin } from 'noxcturnal';

import type { Noxcturnal } from '../noxcturnal-transformer';
import { staticProcessEnvName } from './process-env';

interface PublicEnvState {
  binding: string;
  insertion: number;
  names: Set<string>;
}

export function createDevelopmentPublicEnvPlugin(
  nox: Noxcturnal
): DefinedNativePlugin<PublicEnvState> {
  return nox.defineNativePlugin<PublicEnvState>({
    name: 'expo-reference-development-public-env',
    contract: { metadata: { writes: ['publicEnvVars'] } },
    createState: () => ({ binding: '', insertion: 0, names: new Set() }),
    visitors: [
      nox.defineVisitor(
        'Program',
        {
          scope: true,
          children: { directives: { route: 'Directive', fields: ['value'] } },
        },
        (program, state) => {
          state.binding = program.scope.generateUid('env');
          state.insertion = program.getChildList('directives').at(-1)?.end ?? 0;
        }
      ),
      nox.defineVisitor(
        'StaticMemberExpression|ComputedMemberExpression',
        {
          fields: ['memberPath', 'property'],
          where: { write: { equals: false } },
          scope: true,
        },
        (member, state) => {
          const name = staticProcessEnvName(member.node);
          if (name === null || !name.startsWith('EXPO_PUBLIC_')) return;
          if (member.scope.hasBinding('process')) return;
          state.names.add(name);
          member.replaceWith({
            code: `${state.binding}.env.${name}`,
            mapping: 'anchor-boundaries',
          });
        }
      ),
    ],
    post(context, state) {
      context.metadata.set('publicEnvVars', [...state.names]);
      if (state.names.size === 0) return;
      context.editor.appendRight(
        state.insertion,
        `${state.insertion === 0 ? '' : '\n'}var ${state.binding}=require("expo/virtual/env");\n`
      );
    },
  });
}
