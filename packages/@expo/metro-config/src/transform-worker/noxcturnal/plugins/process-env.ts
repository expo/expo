import path from 'node:path';
import type { DefinedNativePlugin } from 'noxcturnal';

import {
  expoPluginInput,
  mappedLiteral,
  usesPublicEnvPlugin,
  type Noxcturnal,
  type NoxcturnalTransformInput,
} from '../noxcturnal-transformer';
import { addCacheVary } from './cache-vary';

const NO_PROCESS_ENV_REPLACEMENT = Symbol('NO_PROCESS_ENV_REPLACEMENT');

interface ProcessEnvState {
  input: NoxcturnalTransformInput;
  absoluteRouterRoot?: string;
}

export function staticProcessEnvName(node: {
  memberPath?: unknown;
  property?: unknown;
}): string | null {
  if (typeof node.property !== 'string' || node.memberPath !== `process.env.${node.property}`) {
    return null;
  }
  return node.property;
}

function routerRoot(state: ProcessEnvState): string {
  return (state.absoluteRouterRoot ??= (() => {
    const option = state.input.options.customTransformOptions?.routerRoot;
    const root = typeof option === 'string' ? decodeURI(option) : 'app';
    return path.isAbsolute(root) ? root : path.join(state.input.projectRoot, root);
  })());
}

function processEnvReplacement(
  name: string,
  state: ProcessEnvState
): unknown | typeof NO_PROCESS_ENV_REPLACEMENT {
  const { filename, options, projectRoot } = state.input;
  switch (name) {
    case 'EXPO_PROJECT_ROOT':
      return projectRoot;
    case 'EXPO_ROUTER_ABS_APP_ROOT':
      return routerRoot(state);
    case 'EXPO_ROUTER_APP_ROOT':
      return path.relative(path.dirname(filename), routerRoot(state));
    case 'EXPO_ROUTER_IMPORT_MODE':
      return String(options.customTransformOptions?.asyncRoutes) === 'true' ? 'lazy' : 'sync';
    default:
      return !options.dev && usesPublicEnvPlugin(state.input) && name.startsWith('EXPO_PUBLIC_')
        ? process.env[name]
        : NO_PROCESS_ENV_REPLACEMENT;
  }
}

export function createProcessEnvPlugin(nox: Noxcturnal): DefinedNativePlugin<ProcessEnvState> {
  return nox.defineNativePlugin<ProcessEnvState>({
    name: 'expo-process-env',
    createState: (context) => ({ input: expoPluginInput(context) }),
    visitors: [
      nox.defineVisitor(
        'StaticMemberExpression|ComputedMemberExpression',
        {
          fields: ['memberPath', 'property'],
          where: { write: { equals: false } },
          scope: true,
        },
        (member, state) => {
          const name = staticProcessEnvName(member.node);
          if (name === null) return;
          if (member.scope.hasBinding('process')) return;
          const replacement = processEnvReplacement(name, state);
          if (replacement === NO_PROCESS_ENV_REPLACEMENT) return;
          if (!state.input.options.dev && name.startsWith('EXPO_PUBLIC_')) {
            addCacheVary(member.context, { scheme: 'env', name });
          }
          member.replaceWith(mappedLiteral(member.context, replacement));
        }
      ),
    ],
  });
}
