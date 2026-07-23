/** The settled value a read returns, or the in-flight promise the caller suspends on. */
type SuspenseEntry = { data: unknown } | Promise<unknown>;

/**
 * Per-mount store of loader reads, keyed by resolved URL. Holding the settled value (or in-flight
 * promise) lets a re-render read the result instead of re-fetching. Entries are ref-counted and
 * reclaimed once the last mounted reader releases the key, so they stay short-lived.
 */
export class LoaderSuspenseStore {
  private entries = new Map<string, SuspenseEntry>();
  private refCounts = new Map<string, number>();
  private reclaimable = new Set<string>();

  get<T = unknown>(key: string): { data: T } | Promise<T> | undefined {
    return this.entries.get(key) as { data: T } | Promise<T> | undefined;
  }

  keys(): IterableIterator<string> {
    return this.entries.keys();
  }

  set(key: string, entry: SuspenseEntry) {
    this.reclaimable.delete(key);
    this.entries.set(key, entry);
  }

  /** Set server-injected data only when no read has claimed this key yet. */
  seed(key: string, data: unknown) {
    if (!this.entries.has(key)) {
      this.set(key, { data });
    }
  }

  clear(key: string) {
    this.reclaimable.delete(key);
    this.entries.delete(key);
  }

  retain(key: string) {
    this.refCounts.set(key, (this.refCounts.get(key) ?? 0) + 1);
    this.reclaimable.delete(key);
  }

  release(key: string) {
    const next = (this.refCounts.get(key) ?? 1) - 1;
    if (next > 0) {
      this.refCounts.set(key, next);
      return;
    }

    this.refCounts.delete(key);
    this.reclaimable.add(key);
    // Defer so an unmount + remount (Strict Mode, fast navigation) doesn't drop a live entry.
    queueMicrotask(() => {
      if (this.reclaimable.delete(key)) {
        this.entries.delete(key);
      }
    });
  }

  reset() {
    this.entries.clear();
    this.refCounts.clear();
    this.reclaimable.clear();
  }
}
