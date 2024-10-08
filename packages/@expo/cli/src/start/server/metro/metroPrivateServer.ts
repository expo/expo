import type MetroServer from '@bycedric/metro/metro/src/Server';
import assert from 'node:assert';

export type MetroPrivateServer = MetroServer & {
  _bundler: import('@bycedric/metro/metro/src/IncrementalBundler').default;
  _config: import('@bycedric/metro/metro-config').ConfigT;
  _createModuleId: (path: string) => number;
  _isEnded: boolean;
  _nextBundleBuildNumber: number;
  _platforms: Set<string>;
  _reporter: import('@bycedric/metro/metro/src/lib/reporting').Reporter;
  _serverOptions: import('@bycedric/metro/metro/src/Server').ServerOptions | void;

  getNewBuildNumber(): number;
  _getSortedModules(
    graph: import('@bycedric/metro/metro/src/IncrementalBundler').OutputGraph
  ): import('@bycedric/metro/metro/src/DeltaBundler/types.flow').Module[];

  _resolveRelativePath(
    filePath: string,
    {
      relativeTo,
      resolverOptions,
      transformOptions,
    }: {
      relativeTo: 'project' | 'server';
      resolverOptions: import('@bycedric/metro/metro/src/shared/types.flow').ResolverInputOptions;
      transformOptions: import('@bycedric/metro/metro/src/DeltaBundler/types.flow').TransformInputOptions;
    }
  ): Promise<string>;

  _shouldAddModuleToIgnoreList(
    module: import('@bycedric/metro/metro/src/DeltaBundler/types.flow').Module<any>
  ): boolean;
};

export function assertMetroPrivateServer(metro: MetroServer): asserts metro is MetroPrivateServer {
  assert(metro, 'Metro server undefined.');
  assert(
    '_config' in metro && '_bundler' in metro,
    'Metro server is missing expected properties (_config, _bundler). This could be due to a version mismatch or change in the Metro API.'
  );
}
