/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { Graph, MixedOutput, Module } from 'metro';

import { SerializerParameters } from '../../withExpoSerializers';

function modifyDep(mod: Module<MixedOutput>) {
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
      data: { ...output.data, map: [], code: '...', functionMap: {} },
    })),
  };
}

export function simplifyGraph(graph: Graph) {
  return {
    ...graph,
    dependencies: Object.fromEntries(
      [...graph.dependencies.entries()].map(([key, value]) => {
        return [key, modifyDep(value)];
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

export function toFixture(...props: SerializerParameters) {
  const [entryFile, preModules, graph, options] = props;

  console.log('DATA:\n\n');
  console.log(
    require('util').inspect(
      [
        entryFile,
        preModules.map((mod) => modifyDep(mod)),
        simplifyGraph(graph),

        {
          ...options,
          processModuleFilter: '[Function: processModuleFilter]',
          createModuleId: '[Function (anonymous)]',
          getRunModuleStatement: '[Function: getRunModuleStatement]',
          shouldAddToIgnoreList: '[Function: shouldAddToIgnoreList]',
        },
      ],
      { depth: 5000 }
    )
  );
  console.log('\n\n....');
}
