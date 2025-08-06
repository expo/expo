/**
 * Copyright (c) 650 Industries (Expo). All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { codeFrameColumns } from '@babel/code-frame';
import { types as t } from '@babel/core';
import type { Dependency } from '@expo/metro/metro/ModuleGraph/worker/collectDependencies';
import collectDependencies from '@expo/metro/metro/ModuleGraph/worker/collectDependencies';

import { importExportPlugin } from '../import-export-plugin';
import { transformToAst } from './__mocks__/test-helpers-upstream';

const default_opts = {
  importAll: '_$$_IMPORT_ALL',
  importDefault: '_$$_IMPORT_DEFAULT',
};

export function showTransformedDeps(
  code: string,
  plugins: any[] = [importExportPlugin],
  opts = {}
) {
  const mergedOpts = { ...default_opts, ...opts };
  const { dependencies } = collectDependencies(transformToAst(plugins, code, mergedOpts), {
    asyncRequireModulePath: 'asyncRequire',
    dependencyMapName: null,
    dynamicRequires: 'reject',
    inlineableCalls: [mergedOpts.importAll, mergedOpts.importDefault],
    keepRequireNames: true,
    allowOptionalDependencies: false,
    unstable_allowRequireContext: false,
  });

  return formatDependencyLocs(dependencies, code);
}

function formatDependencyLocs(dependencies: readonly Dependency[], code: string) {
  return (
    '\n' +
    dependencies
      .map((dep, depIndex) =>
        dep.data.locs.length
          ? dep.data.locs.map((loc) => formatLoc(loc, depIndex, dep, code)).join('\n')
          : `dep #${depIndex} (${dep.name}): no location recorded`
      )
      .join('\n')
  );
}

function adjustPosForCodeFrame(
  pos: t.SourceLocation['start'] | t.SourceLocation['end'] | null | undefined
) {
  return pos ? { ...pos, column: pos.column + 1 } : pos;
}

function adjustLocForCodeFrame(loc: t.SourceLocation) {
  return {
    start: adjustPosForCodeFrame(loc.start),
    end: adjustPosForCodeFrame(loc.end),
  };
}

function formatLoc(loc: t.SourceLocation, depIndex: number, dep: Dependency, code: string) {
  return codeFrameColumns(
    code,
    // @ts-ignore-error TODO(@kitten): Unclear why this doesn't match up. Are our @babel/* types misaligned or is this incorrect?
    adjustLocForCodeFrame(loc),
    {
      message: `dep #${depIndex} (${dep.name})`,
      linesAbove: 0,
      linesBelow: 0,
    }
  );
}
