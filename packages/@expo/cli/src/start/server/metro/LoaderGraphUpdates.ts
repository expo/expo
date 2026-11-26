import type IncrementalBundler from '@expo/metro/metro/IncrementalBundler';
import type { GraphRevision } from '@expo/metro/metro/IncrementalBundler';
import type MetroServer from '@expo/metro/metro/Server';

import { debugEvent } from './metroDebugEvents';

type Update = ReturnType<IncrementalBundler['updateGraph']>;
type Batch = {
  ready: Promise<void>;
  updates: Map<string, Update>;
  changed: boolean;
};

export class LoaderGraphUpdates {
  // The transformer does not mark every form of loader export, such as `export { loader }`.
  readonly loaderRouteFiles = new Set<string>();
  private graphs = new Map<string, { update: () => Update; unlisten: () => void }>();
  private active = Promise.resolve();
  private pending?: Batch;

  constructor(
    private metro: MetroServer,
    private invalidate: () => void
  ) {}

  watch(revision: GraphRevision, entryPath: string) {
    const { graphId, graph } = revision;
    const existing = this.graphs.get(graphId);
    if (existing) return existing.update;

    const bundler = this.metro.getBundler();
    const [entryPoint = entryPath] = graph.entryPoints;
    let errorMessage: string | undefined;
    const hasLoader = () =>
      this.loaderRouteFiles.has(entryPath) ||
      graph.dependencies
        .get(entryPoint)
        ?.output.some(
          (output) =>
            typeof (output.data as { loaderReference?: unknown } | null)?.loaderReference ===
            'string'
        );

    const queueUpdate = () => {
      const batch = this.pending ?? this.startBatch();
      const queued = batch.updates.get(graphId);
      if (queued) return queued;

      const result = batch.ready.then(async () => {
        const hadLoader = hasLoader();
        try {
          const updated = await bundler.updateGraph(revision, false);
          revision = updated.revision;
          const { added, modified, deleted } = updated.delta;
          if (
            (hadLoader || hasLoader()) &&
            (errorMessage !== undefined || added.size || modified.size || deleted.size)
          ) {
            batch.changed = true;
            debugEvent('loader_graph_changed', { path: entryPath });
          }
          errorMessage = undefined;
          return updated;
        } catch (error: any) {
          if (hadLoader && errorMessage !== error.message) {
            batch.changed = true;
            debugEvent('loader_bundle_failed', {
              path: entryPath,
              error: debugEvent.error(error as Error),
            });
          }
          errorMessage = error.message;
          throw error;
        }
      });
      batch.updates.set(graphId, result);
      return result;
    };

    const unlisten = bundler.getDeltaBundler().listen(graph, async () => {
      // The batch handles errors. A direct request for the same graph gets the original rejection.
      queueUpdate();
    });
    const update = async () => {
      const result = queueUpdate();
      // Clear the SSR module cache before the request evaluates its bundle.
      await this.active;
      return result;
    };
    this.graphs.set(graphId, { update, unlisten });
    return update;
  }

  private startBatch() {
    // Metro emits all graph notifications for a file-map change synchronously. Gather them before
    // starting any updates, then finish this batch before another caller can consume a delta.
    const batch: Batch = {
      ready: this.active,
      updates: new Map(),
      changed: false,
    };
    this.pending = batch;
    this.active = batch.ready.then(async () => {
      this.pending = undefined;
      await Promise.allSettled(batch.updates.values());
      if (batch.changed && this.graphs.size) this.invalidate();
    });
    return batch;
  }

  close() {
    for (const graph of this.graphs.values()) graph.unlisten();
    this.graphs.clear();
  }
}
