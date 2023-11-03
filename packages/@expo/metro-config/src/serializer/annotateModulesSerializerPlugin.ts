/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { MixedOutput, Module, ReadOnlyGraph, SerializerOptions } from 'metro';
import path from 'path';

import { SerializerParameters } from './withExpoSerializers';

const debug = require('debug')('expo:metro-config:serializer:annotate') as typeof console.log;

export function annotateModule(projectRoot: string, mod: Module<MixedOutput>) {
  const filePath = path.relative(projectRoot, mod.path);
  mod.output.forEach((outputItem) => {
    outputItem.data.code = ['', `// ${filePath}`, outputItem.data.code].join('\n');
    if ('lineCount' in outputItem.data && typeof outputItem.data.lineCount === 'number') {
      outputItem.data.lineCount = (outputItem.data.lineCount as number) + 2;
    }

    // TODO: Probably need to update sourcemaps here.
  });
  return mod;
}

export function createAnnotateModulesSerializerPlugin({ force }: { force?: boolean }) {
  return function annotateModulesSerializerPlugin(
    entryPoint: string,
    preModules: readonly Module<MixedOutput>[],
    graph: ReadOnlyGraph,
    options: SerializerOptions
  ): SerializerParameters {
    if (force === false) {
      debug('Annotations have been disabled');
      return [entryPoint, preModules, graph, options];
    }

    if (options.dev || force) {
      debug('Annotating modules with descriptions');

      for (const mod of preModules) {
        annotateModule(options.projectRoot, mod);
      }

      for (const value of graph.dependencies.values()) {
        annotateModule(options.projectRoot, value);
      }
    }

    return [entryPoint, preModules, graph, options];
  };
}
