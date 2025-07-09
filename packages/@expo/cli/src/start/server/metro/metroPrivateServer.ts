import { TransformInputOptions } from 'metro';
import type Metro from 'metro';
import { ConfigT } from 'metro-config';
import assert from 'node:assert';

export type MetroPrivateServer = import('metro').Server & {
  _bundler: import('metro/src/IncrementalBundler').default;
  _config: ConfigT;
  _createModuleId: (path: string, context?: { environment?: string; platform: string }) => number;
  _isEnded: boolean;
  _nextBundleBuildNumber: number;
  _platforms: Set<string>;
  _reporter: import('metro/src/lib/reporting').Reporter;
  _serverOptions: import('metro').ServerOptions | void;

  getNewBuildNumber(): number;
  _getSortedModules(
    graph: import('metro/src/IncrementalBundler').OutputGraph
  ): import('metro/src/DeltaBundler/types').Module[];

  _resolveRelativePath(
    filePath: string,
    {
      relativeTo,
      resolverOptions,
      transformOptions,
    }: {
      relativeTo: 'project' | 'server';
      resolverOptions: import('metro/src/shared/types').ResolverInputOptions;
      transformOptions: TransformInputOptions;
    }
  ): Promise<string>;

  _shouldAddModuleToIgnoreList(module: import('metro/src/DeltaBundler/types').Module<any>): boolean;
};

export function assertMetroPrivateServer(metro: Metro.Server): asserts metro is MetroPrivateServer {
  assert(metro, 'Metro server undefined.');
  assert(
    '_config' in metro && '_bundler' in metro,
    'Metro server is missing expected properties (_config, _bundler). This could be due to a version mismatch or change in the Metro API.'
  );
}
