import type { DefinedNativePlugin } from 'noxcturnal';

import {
  metroPluginData,
  type MetroPseudoGlobals,
  type Noxcturnal,
} from '../noxcturnal-transformer';

interface MetroEsmGlobalsState {
  names: MetroPseudoGlobals;
}

function pseudoGlobalName(
  scope: { hasBinding(name: string): boolean; generateUid(name: string): string },
  preferred: string
): string {
  return scope.hasBinding(preferred) ? scope.generateUid(preferred) : preferred;
}

export function createMetroEsmGlobalsPlugin(
  nox: Noxcturnal
): DefinedNativePlugin<MetroEsmGlobalsState> {
  return nox.defineNativePlugin<MetroEsmGlobalsState>({
    name: 'metro-native-esm-pseudo-global-renames',
    createState: () => ({ names: { global: 'g', module: 'm', exports: 'e' } }),
    visitors: [
      nox.defineVisitor('Program', { scope: true }, (program, state) => {
        for (const name of ['global', 'require', 'module', 'exports']) {
          if (program.scope.hasBinding(name)) {
            program.scope.rename(name, program.scope.generateUid(name));
          }
        }
        if (!metroPluginData(program.context).normalizePseudoGlobals) return;
        state.names.global = pseudoGlobalName(program.scope, 'g');
        state.names.module = pseudoGlobalName(program.scope, 'm');
        state.names.exports = pseudoGlobalName(program.scope, 'e');
        metroPluginData(program.context).pseudoGlobals = state.names;
      }),
      nox.defineVisitor(
        'Identifier',
        {
          fields: ['name', 'global'],
          where: { name: { oneOf: ['global', 'module', 'exports'] } },
        },
        (identifier, state) => {
          if (
            identifier.node.global !== true ||
            !metroPluginData(identifier.context).normalizePseudoGlobals
          ) {
            return;
          }
          const replacement = state.names[String(identifier.node.name) as keyof typeof state.names];
          if (replacement) identifier.replaceWith(replacement);
        }
      ),
    ],
  });
}
