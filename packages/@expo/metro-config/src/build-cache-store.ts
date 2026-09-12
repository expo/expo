import { FileStore } from './binary-file-store';

/** Collects only results used by this build in the output directory. */
export class BuildCacheStore<T> {
  private readonly output: FileStore<T>;
  private readonly restored: FileStore<T>;

  constructor({ restoredRoot, outputRoot }: { restoredRoot: string; outputRoot: string }) {
    // The build runner creates an empty output directory once per job.
    // Do not clear it here: multiple Metro processes can share the same job.
    this.output = new FileStore<T>({ root: outputRoot });
    this.restored = new FileStore<T>({ root: restoredRoot });
  }

  async get(key: Buffer): Promise<T | null | undefined> {
    const current = await this.output.get(key);
    if (current != null) {
      return current;
    }
    const previous = await this.restored.get(key);
    if (previous != null) {
      // Complete promotion here, even if Metro does not call set after a hit.
      await this.output.set(key, previous);
    }
    return previous;
  }

  set(key: Buffer, value: T): Promise<void> {
    return this.output.set(key, value);
  }

  clear(): void {
    this.output.clear();
    this.restored.clear();
  }
}
