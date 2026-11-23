import type { LoaderResult } from './types';

type Pending = { promise: Promise<void>; wake: () => void };
type Entry = { value?: LoaderResult; pending?: Pending; version: number };

/** Stores values and stable Suspense wakeables without deciding which routes retain them. */
export class LoaderSuspenseStore {
  private entries = new Map<string, Entry>();
  private revision = 0;

  value(path: string) {
    return this.entries.get(path)?.value;
  }

  version(path: string) {
    return this.entries.get(path)?.version ?? 0;
  }

  pending(path: string) {
    return this.entries.get(path)?.pending?.promise;
  }

  suspend(path: string): Promise<void> {
    const entry: Entry = this.entries.get(path) ?? { version: 0 };
    if (!entry.pending) {
      let wake!: () => void;
      const promise = new Promise<void>((resolve) => (wake = resolve));
      entry.pending = { promise, wake };
      entry.version = ++this.revision;
      this.entries.set(path, entry);
    }
    return entry.pending.promise;
  }

  seed(path: string, data: unknown): boolean {
    const entry = this.entries.get(path);
    if (entry?.value || entry?.pending) return false;
    this.entries.set(path, { value: { data }, version: ++this.revision });
    return true;
  }

  settle(path: string, result: LoaderResult) {
    const pending = this.entries.get(path)?.pending;
    this.entries.set(path, { value: result, version: ++this.revision });
    pending?.wake();
  }

  evict(path: string, expected: LoaderResult) {
    const entry = this.entries.get(path);
    if (entry?.value === expected) {
      entry.value = undefined;
      entry.version = ++this.revision;
    }
  }

  release(path: string) {
    const pending = this.entries.get(path)?.pending;
    this.entries.set(path, { version: ++this.revision });
    pending?.wake();
  }
}
