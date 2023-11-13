/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import crypto from 'crypto';
import fs from 'fs';
import { MixedOutput, Module, ReadOnlyGraph } from 'metro';
import path from 'path';

import { SerializerParameters } from '../../withExpoSerializers';

function modifyDep(mod: Module<MixedOutput>, dropSource: boolean = false) {
  return {
    dependencies: Object.fromEntries(
      [...mod.dependencies.entries()].map(([key, value]) => {
        return [key, value];
      })
    ),
    getSource: '[MOCK_FUNCTION]',
    inverseDependencies: Array.from(mod.inverseDependencies),
    path: mod.path,
    output: mod.output.map((output) => ({
      type: output.type,
      data: { ...output.data, ...(dropSource ? { map: [], code: '...', functionMap: {} } : {}) },
    })),
  };
}

export function simplifyGraph(graph: ReadOnlyGraph, dropSource: boolean = false) {
  return {
    ...graph,
    dependencies: Object.fromEntries(
      [...graph.dependencies.entries()].map(([key, value]) => {
        return [key, modifyDep(value, dropSource)];
      })
    ),
    entryPoints: [...graph.entryPoints.entries()],
    transformOptions: {
      ...graph.transformOptions,
      customTransformOptions: {
        ...graph.transformOptions?.customTransformOptions,
      },
    },
  };
}

function storeFixture(name: string, obj: any) {
  const filePath = path.join(
    __dirname.replace('metro-config/build/', 'metro-config/src/'),
    `${name}.json`
  );
  fs.writeFileSync(filePath, JSON.stringify(obj, null, 2));
}

export function toFixture(...props: SerializerParameters) {
  const [entryFile, preModules, graph, options] = props;

  const dropSource = false;
  const json = [
    entryFile,
    preModules.map((mod) => modifyDep(mod, dropSource)),
    simplifyGraph(graph, dropSource),

    {
      ...options,
      processModuleFilter: '[Function: processModuleFilter]',
      createModuleId: '[Function (anonymous)]',
      getRunModuleStatement: '[Function: getRunModuleStatement]',
      shouldAddToIgnoreList: '[Function: shouldAddToIgnoreList]',
    },
  ];
  console.log('DATA:\n\n');
  console.log(require('util').inspect(json, { depth: 5000 }));
  console.log('\n\n....');

  const hashContents = crypto.createHash('sha256').update(JSON.stringify(json)).digest('hex');

  const platform =
    graph.transformOptions?.platform ??
    ((options.sourceUrl ? new URL(options.sourceUrl).searchParams.get('platform') : '') ||
      'unknown_platform');

  storeFixture(
    [path.basename(entryFile).replace(/\.[tj]sx?/, ''), platform, hashContents]
      .filter(Boolean)
      .join('-'),
    json
  );
}
