import type MetroServer from '@expo/metro/metro/Server';
import type { ConfigT } from '@expo/metro/metro-config';
import assert from 'node:assert';

// TODO(@kitten): Delete since private types are exposed on @expo/metro
export type MetroPrivateServer = MetroServer & {
  _bundler: import('@expo/metro/metro/IncrementalBundler').default;
  _config: ConfigT;
  _createModuleId: (path: string, context?: { environment?: string; platform: string }) => number;
  _isEnded: boolean;
  _nextBundleBuildNumber: number;
  _platforms: Set<string>;
  _reporter: import('@expo/metro/metro/lib/reporting').Reporter;
  _serverOptions: import('@expo/metro/metro/Server').ServerOptions | void;

  getNewBuildNumber(): number;
  _getSortedModules(
    graph: import('@expo/metro/metro/IncrementalBundler').OutputGraph
  ): import('@expo/metro/metro/DeltaBundler/types.flow').Module[];

  _resolveRelativePath(
    filePath: string,
    {
      relativeTo,
      resolverOptions,
      transformOptions,
    }: {
      relativeTo: 'project' | 'server';
      resolverOptions: import('@expo/metro/metro/shared/types.flow').ResolverInputOptions;
      transformOptions: import('@expo/metro/metro/DeltaBundler/types.flow').TransformInputOptions;
    }
  ): Promise<string>;

  _shouldAddModuleToIgnoreList(module: import('@expo/metro/metro/DeltaBundler/types.flow').Module): boolean;
};

export function assertMetroPrivateServer(metro: MetroServer): asserts metro is MetroPrivateServer {
  assert(metro, 'Metro server undefined.');
  assert(
    '_config' in metro && '_bundler' in metro,
    'Metro server is missing expected properties (_config, _bundler). This could be due to a version mismatch or change in the Metro API.'
  );
}
