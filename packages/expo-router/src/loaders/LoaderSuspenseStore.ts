type SuspenseEntry = { data: unknown } | { error: unknown } | Promise<unknown>;

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

  expireError(key: string) {
    const entry = this.entries.get(key);
    if (!entry) {
      return;
    }
    queueMicrotask(() => {
      if (this.entries.get(key) === entry) {
        this.clear(key);
      }
    });
  }

  keys(): string[] {
    return [...this.entries.keys()];
  }

  reset() {
    this.entries.clear();
    this.reclaim.clear();
  }
}
