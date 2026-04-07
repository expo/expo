/**
 * Promise-based per-key lock for artifact downloads.
 *
 * When multiple packages start in parallel, they may all request the same
 * flavor's artifacts simultaneously. This lock ensures each flavor is
 * downloaded exactly once — concurrent callers await the same promise.
 */
import type { DownloadedDependencies } from '../Artifacts.types';
import type { BuildFlavor } from '../Prebuilder.types';

export class ArtifactLock {
  private pending = new Map<string, Promise<DownloadedDependencies | null>>();

  /**
   * Returns the cached result for `flavor`, or calls `download` exactly once
   * and shares the resulting promise with all concurrent callers.
   */
  async acquire(
    flavor: BuildFlavor,
    download: () => Promise<DownloadedDependencies | null>
  ): Promise<DownloadedDependencies | null> {
    const existing = this.pending.get(flavor);
    if (existing) {
      return existing;
    }
    const promise = download();
    this.pending.set(flavor, promise);
    return promise;
  }
}
