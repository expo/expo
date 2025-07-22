/**
 * Copyright (c) 650 Industries (Expo). All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { codeFrameColumns } from '@babel/code-frame';
import type { SourceLocation as BabelSourceLocation } from '@babel/types';
import type { Dependency } from 'metro/src/ModuleGraph/worker/collectDependencies';
import collectDependencies from 'metro/src/ModuleGraph/worker/collectDependencies';

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
  pos: BabelSourceLocation['start'] | BabelSourceLocation['end'] | null | undefined
) {
  return pos ? { ...pos, column: pos.column + 1 } : pos;
}

function adjustLocForCodeFrame(loc: BabelSourceLocation) {
  return {
    start: adjustPosForCodeFrame(loc.start),
    end: adjustPosForCodeFrame(loc.end),
  };
}

function formatLoc(loc: BabelSourceLocation, depIndex: number, dep: Dependency, code: string) {
  return codeFrameColumns(code, adjustLocForCodeFrame(loc), {
    message: `dep #${depIndex} (${dep.name})`,
    linesAbove: 0,
    linesBelow: 0,
  });
}
