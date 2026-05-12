/**
 * Generic version-stamp utility for cache invalidation.
 *
 * Writes a simple key=value stamp file into a directory. On subsequent runs,
 * callers check whether the stored entries match the current expected values.
 * If any value differs (or the stamp is missing), the cache is considered stale.
 *
 * Used by VFS overlay generation, codegen, and any other step that caches
 * artifacts derived from versioned sources.
 */
import fs from 'fs-extra';
import path from 'path';

type StampEntries = Record<string, string>;

const DEFAULT_FILENAME = '.version-stamp';

function stampPath(dir: string, filename: string): string {
  return path.join(dir, filename);
}

function serialize(entries: StampEntries): string {
  return Object.entries(entries)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
}

function deserialize(content: string): StampEntries {
  const entries: StampEntries = {};
  for (const line of content.split('\n')) {
    const idx = line.indexOf('=');
    if (idx > 0) {
      entries[line.slice(0, idx)] = line.slice(idx + 1);
    }
  }
  return entries;
}

export const VersionStamp = {
  /**
   * Write a version stamp file with the given key=value entries.
   */
  write(dir: string, entries: StampEntries, filename: string = DEFAULT_FILENAME): void {
    fs.ensureDirSync(dir);
    fs.writeFileSync(stampPath(dir, filename), serialize(entries));
  },

  /**
   * Read the stored stamp entries, or null if no stamp exists.
   */
  read(dir: string, filename: string = DEFAULT_FILENAME): StampEntries | null {
    const fp = stampPath(dir, filename);
    if (!fs.existsSync(fp)) return null;
    return deserialize(fs.readFileSync(fp, 'utf8'));
  },

  /**
   * Check whether the stored stamp matches the expected entries exactly.
   * Returns false if the stamp is missing, has different keys, or any value differs.
   */
  isUpToDate(dir: string, expected: StampEntries, filename: string = DEFAULT_FILENAME): boolean {
    const stored = VersionStamp.read(dir, filename);
    if (!stored) return false;

    const storedKeys = Object.keys(stored).sort();
    const expectedKeys = Object.keys(expected).sort();

    if (storedKeys.length !== expectedKeys.length) return false;
    for (let i = 0; i < storedKeys.length; i++) {
      if (storedKeys[i] !== expectedKeys[i]) return false;
    }
    for (const key of expectedKeys) {
      if (stored[key] !== expected[key]) return false;
    }
    return true;
  },
};
