/**
 * Copyright © 2024 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Original: https://github.com/facebook/react-native/blob/00175bd/packages/react-native-babel-preset/src/plugin-warn-on-deep-imports.js#L106

import type { ConfigAPI, PluginObj, types as t } from '@babel/core';

import { getIsNodeModule } from './common';

function getWarningMessage(
  importPath: string,
  loc: t.SourceLocation | undefined | null,
  source: string
) {
  const message = `Deep imports from the 'react-native' package are deprecated ('${importPath}').`;

  if (source !== undefined) {
    return `${message} Source: ${source} ${loc ? `${loc.start.line}:${loc.start.column}` : ''}`;
  }

  return message;
}

function createWarning(
  t: typeof import('@babel/types'),
  importPath: string,
  loc: t.SourceLocation | undefined | null,
  source: string
) {
  const warningMessage = getWarningMessage(importPath, loc, source);

  const warning = t.expressionStatement(
    t.callExpression(t.memberExpression(t.identifier('console'), t.identifier('warn')), [
      t.stringLiteral(warningMessage),
    ])
  );

  return warning;
}

function isDeepReactNativeImport(source: string) {
  const parts = source.split('/');
  return parts.length > 1 && parts[0] === 'react-native';
}

function isInitializeCoreImport(source: string) {
  return source === 'react-native/Libraries/Core/InitializeCore';
}

function withLocation<T extends t.Node>(node: T, loc: t.SourceLocation | null | undefined): T {
  if (!node.loc) {
    return { ...node, loc };
  }
  return node;
}

interface ImportRef {
  source: string;
  loc?: t.SourceLocation | null;
}

interface State {
  filename: string;
  isExcluded: boolean;
  require: ImportRef[];
  import: ImportRef[];
  export: ImportRef[];
}

export const reactNativeWarnOnDeepImportsPlugin = ({
  types: t,
  caller,
}: ConfigAPI & typeof import('@babel/core')): PluginObj<State> => {
  const isNodeModule = caller(getIsNodeModule);
  return {
    name: 'warn-on-deep-imports',
    visitor: {
      ImportDeclaration(path, state) {
        const source = path.node.source.value;

        if (
          !state.isExcluded &&
          isDeepReactNativeImport(source) &&
          !isInitializeCoreImport(source)
        ) {
          const loc = path.node.loc;
          state.import.push({ source, loc });
        }
      },
      CallExpression(path, state) {
        const callee = path.get('callee');
        const args = path.get('arguments');

        if (
          !state.isExcluded &&
          callee.isIdentifier({ name: 'require' }) &&
          args.length === 1 &&
          args[0].isStringLiteral()
        ) {
          const source = args[0].node.type === 'StringLiteral' ? args[0].node.value : '';
          if (isDeepReactNativeImport(source) && !isInitializeCoreImport(source)) {
            const loc = path.node.loc;
            state.require.push({ source, loc });
          }
        }
      },
      ExportNamedDeclaration(path, state) {
        const source = path.node.source;

        if (
          source &&
          !state.isExcluded &&
          isDeepReactNativeImport(source.value) &&
          !isInitializeCoreImport(source.value) // NOTE: This contained a bug before (source v source.value)
        ) {
          const loc = path.node.loc;
          state.export.push({ source: source.value, loc });
        }
      },
      Program: {
        enter(_path, state) {
          // NOTE(@kitten): We don't output warnings for node modules to the user
          // That's because users can do very little about these warnings, and it's redundant to show warnings to users, rather than library maintainers
          state.isExcluded = isNodeModule;
          state.require = [];
          state.import = [];
          state.export = [];
        },
        exit(path, state) {
          const { body } = path.node;
          if (state.isExcluded) {
            return;
          }

          const requireWarnings = state.require.map((value) =>
            withLocation(createWarning(t, value.source, value.loc, state.filename), value.loc)
          );

          const importWarnings = state.import.map((value) =>
            withLocation(createWarning(t, value.source, value.loc, state.filename), value.loc)
          );

          const exportWarnings = state.export.map((value) =>
            withLocation(createWarning(t, value.source, value.loc, state.filename), value.loc)
          );

          const warnings = [...requireWarnings, ...importWarnings, ...exportWarnings];

          body.push(...warnings);
        },
      },
    },
  };
};
