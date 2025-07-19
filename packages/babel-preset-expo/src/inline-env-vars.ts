import type { ConfigAPI, NodePath, PluginObj, types as t } from '@babel/core';

import { createAddNamedImportOnce, getIsProd } from './common';

const debug = require('debug')('expo:babel:env-vars');

export function expoInlineEnvVars(api: ConfigAPI & typeof import('@babel/core')): PluginObj {
  const { types: t } = api;
  const isProduction = api.caller(getIsProd);

  function isFirstInAssign(path: NodePath<t.MemberExpression>) {
    return t.isAssignmentExpression(path.parent) && path.parent.left === path.node;
  }

  let addEnvImport: () => t.Identifier;

  const publicEnvVars = new Set<string>();

  return {
    name: 'expo-inline-or-reference-env-vars',
    pre(file) {
      const addNamedImportOnce = createAddNamedImportOnce(t);

      addEnvImport = () => {
        return addNamedImportOnce(file.path, 'env', 'expo/virtual/env');
      };
    },
    visitor: {
      MemberExpression(path, state) {
        const filename = state.filename;
        if (path.get('object').matchesPattern('process.env')) {
          const key = path.toComputedKey();
          if (
            t.isStringLiteral(key) &&
            !isFirstInAssign(path) &&
            key.value.startsWith('EXPO_PUBLIC_')
          ) {
            const envVar = key.value;
            debug(
              `${isProduction ? 'Inlining' : 'Referencing'} environment variable in %s: %s`,
              filename,
              envVar
            );

            publicEnvVars.add(envVar);
            if (isProduction) {
              path.replaceWith(t.valueToNode(process.env[envVar]));
            } else {
              path.replaceWith(t.memberExpression(addEnvImport(), t.identifier(envVar)));
            }
          }
        }
      },
    },
    post(file) {
      assertExpoMetadata(file.metadata);
      file.metadata.publicEnvVars = Array.from(publicEnvVars);
    },
  };
}

function assertExpoMetadata(metadata: any): asserts metadata is {
  publicEnvVars?: string[];
} {
  if (!metadata || typeof metadata !== 'object') {
    throw new Error('Expected Babel state.file.metadata to be an object');
  }
}
