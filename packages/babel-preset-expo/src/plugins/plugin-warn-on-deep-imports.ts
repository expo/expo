/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Vendored from `@react-native/babel-preset`.
 * https://github.com/facebook/react-native/blob/main/packages/react-native-babel-preset/src/plugin-warn-on-deep-imports.js
 */

import type { ConfigAPI, PluginObj, types as t } from '@babel/core';

function getWarningMessage(
  importPath: string,
  loc: t.SourceLocation | null | undefined,
  source: string | undefined
) {
  const message = `Deep imports from the 'react-native' package are deprecated ('${importPath}').`;

  if (source !== undefined) {
    return `${message} Source: ${source} ${loc ? `${loc.start.line}:${loc.start.column}` : ''}`;
  }

  return message;
}

function createWarning(
  t: typeof import('@babel/core').types,
  importPath: string,
  loc: t.SourceLocation | null | undefined,
  source: string | undefined
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

function withLocation<TNode extends t.Node>(node: TNode, loc: t.SourceLocation | null | undefined) {
  if (!node.loc) {
    return { ...node, loc };
  }
  return node;
}

interface DeepImportEntry {
  source: string;
  loc: t.SourceLocation | null | undefined;
}

export default ({ types: t }: ConfigAPI & typeof import('@babel/core')): PluginObj => ({
  name: 'warn-on-deep-imports',
  visitor: {
    ImportDeclaration(path, state) {
      const source = path.node.source.value;

      if (isDeepReactNativeImport(source) && !isInitializeCoreImport(source)) {
        const loc = path.node.loc;
        (state as any).import.push({ source, loc });
      }
    },
    CallExpression(path, state) {
      const callee = path.get('callee');
      const args = path.get('arguments');

      if (
        callee.isIdentifier({ name: 'require' }) &&
        args.length === 1 &&
        args[0]!.isStringLiteral()
      ) {
        const source = args[0]!.node.type === 'StringLiteral' ? args[0]!.node.value : '';
        if (isDeepReactNativeImport(source) && !isInitializeCoreImport(source)) {
          const loc = path.node.loc;
          (state as any).require.push({ source, loc });
        }
      }
    },
    ExportNamedDeclaration(path, state) {
      const source = path.node.source;

      if (
        source &&
        isDeepReactNativeImport(source.value) &&
        !isInitializeCoreImport(source.value)
      ) {
        const loc = path.node.loc;
        (state as any).export.push({ source: source.value, loc });
      }
    },
    Program: {
      enter(_path, state) {
        (state as any).require = [];
        (state as any).import = [];
        (state as any).export = [];
      },
      exit(path, state) {
        const { body } = path.node;

        const requireWarnings = (state as any).require.map((value: DeepImportEntry) =>
          withLocation(
            createWarning(t, value.source, value.loc, (state as any).filename),
            value.loc
          )
        );

        const importWarnings = (state as any).import.map((value: DeepImportEntry) =>
          withLocation(
            createWarning(t, value.source, value.loc, (state as any).filename),
            value.loc
          )
        );

        const exportWarnings = (state as any).export.map((value: DeepImportEntry) =>
          withLocation(
            createWarning(t, value.source, value.loc, (state as any).filename),
            value.loc
          )
        );

        const warnings = [...requireWarnings, ...importWarnings, ...exportWarnings];

        body.push(...warnings);
      },
    },
  },
});
