type SuspenseEntry = { data: unknown } | { error: unknown } | Promise<unknown>;

/**
 * Stores pending and settled loader reads for React Suspense.
 *
 * Disposal marks an entry reclaimable, teardown confirms its removal, and a replacement written
 * between them cancels reclamation.
 */
export class LoaderSuspenseStore {
  private entries = new Map<string, SuspenseEntry>();
  private reclaim = new Set<string>();

  get<T = unknown>(key: string): { data: T } | { error: unknown } | Promise<T> | undefined {
    return this.entries.get(key) as { data: T } | { error: unknown } | Promise<T> | undefined;
  }

  set(key: string, entry: SuspenseEntry) {
    this.reclaim.delete(key);
    this.entries.set(key, entry);
  }

  seed(key: string, data: unknown) {
    if (!this.entries.has(key)) {
      this.set(key, { data });
    }
  }

  clear(key: string) {
    this.reclaim.delete(key);
    this.entries.delete(key);
  }

  dispose(key: string) {
    this.reclaim.add(key);
  }

  teardown(key: string) {
    if (this.reclaim.delete(key)) {
      this.entries.delete(key);
    }
  }

  retain(livePaths: ReadonlySet<string>) {
    for (const path of this.entries.keys()) {
      if (!livePaths.has(path)) {
        this.clear(path);
      }
    }
  }

  reset() {
    this.entries.clear();
    this.reclaim.clear();
  }
}
