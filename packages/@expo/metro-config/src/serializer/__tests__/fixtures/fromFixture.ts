import type { MixedOutput, Module } from 'metro';

import { SerializerParameters } from '../../withExpoSerializers';

export const processModuleFilter = (modules: Module) => {
  return true;
};

export const shouldAddToIgnoreList = () => {
  return false;
};

function getSource() {
  return Buffer.from('...');
}

export function createModuleIdFactory() {
  const fileToIdMap: Map<string, number> = new Map();
  let nextId = 0;
  return (path: string) => {
    let id = fileToIdMap.get(path);
    if (typeof id !== 'number') {
      id = nextId++;
      fileToIdMap.set(path, id);
    }
    return id;
  };
}

export const getRunModuleStatement = (moduleId: string | number) =>
  // A name that's easy to grep for.
  `TEST_RUN_MODULE(${JSON.stringify(moduleId)});`;

export function fromFixture(props: SerializerParameters[]): SerializerParameters {
  const [entryFile, preModules, graph, options] = props;
  function modifyDep(mod: Module<MixedOutput>) {
    return {
      ...mod,
      dependencies: new Map(
        Object.entries(mod.dependencies).map(([key, value]) => {
          return [key, value];
        })
      ),
      getSource,
      inverseDependencies: new Set(mod.inverseDependencies),
      //   path: mod.path,
      //   output: mod.output.map((output) => ({
      //     type: output.type,
      //     data: { ...output.data, map: [], code: '...', functionMap: {} },
      //   })),
      //   output: mod.output.map((output) => ({
      //     type: output.type,
      //     data: { ...output.data, map: [], code: '...', functionMap: {} },
      //   })),
    };
  }

  return [
    entryFile,
    preModules.map((mod) => modifyDep(mod)),
    {
      ...graph,
      dependencies: new Map(
        Object.entries(graph.dependencies).map(([key, value]) => {
          return [key, modifyDep(value)];
        })
      ),
      entryPoints: new Set(graph.entryPoints),
      transformOptions: {
        ...graph.transformOptions,
        customTransformOptions: {
          ...graph.transformOptions.customTransformOptions,
        },
      },
    },
    {
      ...options,
      processModuleFilter,
      createModuleId: createModuleIdFactory(),
      getRunModuleStatement,
      shouldAddToIgnoreList,
    },
  ];
}
