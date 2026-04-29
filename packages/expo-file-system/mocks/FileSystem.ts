/**
 * Hand-maintained mock for the FileSystem native module.
 *
 * Backs the class-based API (`File`, `Directory`, `Paths` from
 * `expo-file-system`) with a small in-memory filesystem so tests can exercise
 * create/write/read/move/copy/delete end-to-end. This module is what
 * `jest-expo`'s preset feeds to `requireNativeModule('FileSystem')`.
 *
 * DO NOT regenerate this file with `expo-modules-test-core` — the generator
 * emits a bare stub and will overwrite the behavior here. Same pattern as
 * `packages/expo-crypto/mocks/ExpoCryptoAES.ts`.
 */

export type URL = string;
export type FileSystemPath = any;
export type DownloadOptions = any;
export type InfoOptions = any;
export type TypedArray = any;
export type CreateOptions = any;

export const documentDirectory = 'file:///mock/document/';
export const cacheDirectory = 'file:///mock/cache/';
export const bundleDirectory = 'file:///mock/bundle/';
export const appleSharedContainers: Record<string, string> = {};
export const totalDiskSpace = 1_000_000_000;
export const availableDiskSpace = 500_000_000;

type Entry = {
  kind: 'file' | 'dir';
  bytes?: Uint8Array;
  type?: string | null;
  exists: boolean;
};

const store = new Map<string, Entry>();

const SEED_DIRS = [documentDirectory, cacheDirectory, bundleDirectory];

function seed() {
  for (const uri of SEED_DIRS) {
    store.set(normalizeKey(uri), { kind: 'dir', exists: true });
  }
}

/**
 * Test-only helper: reset the in-memory filesystem to a clean state with only
 * the canonical `document`, `cache`, and `bundle` directories seeded.
 * Call from a `beforeEach` to keep tests isolated.
 */
export function __resetMockFileSystem() {
  store.clear();
  listeners.clear();
  cancelled.clear();
  seed();
}

seed();

function normalizeKey(uri: string): string {
  return uri.endsWith('/') ? uri.slice(0, -1) : uri;
}

function basename(uri: string): string {
  const key = normalizeKey(uri);
  const i = key.lastIndexOf('/');
  return i === -1 ? key : key.slice(i + 1);
}

function parentOf(uri: string): string {
  const key = normalizeKey(uri);
  const i = key.lastIndexOf('/');
  return i === -1 ? '' : key.slice(0, i);
}

function joinUri(dir: string, name: string): string {
  const base = normalizeKey(dir);
  return `${base}/${name}`;
}

function utf8Encode(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

function utf8Decode(b: Uint8Array): string {
  return new TextDecoder('utf-8').decode(b);
}

function base64Encode(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64');
}

function base64Decode(str: string): Uint8Array {
  return new Uint8Array(Buffer.from(str, 'base64'));
}

function fakeMd5(uri: string, size: number): string {
  let h = 0x811c9dc5;
  const src = `${uri}:${size}`;
  for (let i = 0; i < src.length; i++) {
    h = Math.imul(h ^ src.charCodeAt(i), 0x01000193);
  }
  const hex = (h >>> 0).toString(16).padStart(8, '0');
  return hex.repeat(4).slice(0, 32);
}

const listeners = new Map<string, Set<(event: any) => void>>();
const cancelled = new Set<string>();

function emit(event: string, data: any) {
  const set = listeners.get(event);
  if (!set) return;
  for (const fn of set) {
    try {
      fn(data);
    } catch {
      /* ignore listener errors in the mock */
    }
  }
}

export function addListener(event: string, handler: (data: any) => void) {
  let set = listeners.get(event);
  if (!set) {
    set = new Set();
    listeners.set(event, set);
  }
  set.add(handler);
  return {
    remove: () => {
      set!.delete(handler);
    },
  };
}

export function info(uri: string): { exists: boolean; isDirectory: boolean | null } {
  const entry = store.get(normalizeKey(uri));
  if (!entry || !entry.exists) return { exists: false, isDirectory: null };
  return { exists: true, isDirectory: entry.kind === 'dir' };
}

function assertParent(uri: string, allowMissing: boolean) {
  const parent = normalizeKey(parentOf(uri));
  if (!parent) return;
  const entry = store.get(parent);
  if (entry?.exists) return;
  if (!allowMissing) {
    throw new Error('Parent directory does not exist');
  }
  const missing: string[] = [];
  let cursor = parent;
  // Stop walking once we've peeled back to the scheme (e.g. "file://") so we
  // don't seed nonsense keys above the root.
  while (cursor && cursor.length >= 8 && !store.get(cursor)?.exists) {
    missing.unshift(cursor);
    const next = normalizeKey(parentOf(cursor));
    if (next === cursor) break;
    cursor = next;
  }
  for (const dirKey of missing) {
    store.set(dirKey, { kind: 'dir', exists: true });
  }
}

export class FileSystemFile {
  uri: string;

  constructor(uri: string) {
    this.uri = uri;
  }

  validatePath(): void {}

  get exists(): boolean {
    const entry = store.get(normalizeKey(this.uri));
    return !!(entry && entry.kind === 'file' && entry.exists);
  }

  get size(): number | null {
    const entry = store.get(normalizeKey(this.uri));
    return entry && entry.kind === 'file' && entry.exists ? (entry.bytes?.length ?? 0) : null;
  }

  get type(): string | null {
    const entry = store.get(normalizeKey(this.uri));
    return entry?.type ?? null;
  }

  get md5(): string | null {
    return this.exists ? fakeMd5(this.uri, this.size ?? 0) : null;
  }

  create(options: { intermediates?: boolean; overwrite?: boolean } = {}): void {
    const key = normalizeKey(this.uri);
    const existing = store.get(key);
    if (existing?.exists) {
      if (!options.overwrite) {
        throw new Error('File already exists');
      }
    }
    assertParent(this.uri, !!options.intermediates);
    store.set(key, { kind: 'file', bytes: new Uint8Array(0), exists: true });
  }

  write(
    content: string | Uint8Array,
    options: { append?: boolean; encoding?: 'utf8' | 'base64' } = {}
  ): void {
    assertParent(this.uri, false);
    let bytes: Uint8Array;
    if (typeof content === 'string') {
      bytes = options.encoding === 'base64' ? base64Decode(content) : utf8Encode(content);
    } else {
      bytes = new Uint8Array(content);
    }
    const key = normalizeKey(this.uri);
    if (options.append) {
      const existing = store.get(key);
      const prior = existing?.bytes ?? new Uint8Array(0);
      const merged = new Uint8Array(prior.length + bytes.length);
      merged.set(prior, 0);
      merged.set(bytes, prior.length);
      store.set(key, { kind: 'file', bytes: merged, exists: true });
    } else {
      store.set(key, { kind: 'file', bytes, exists: true });
    }
  }

  private readBytesOrThrow(): Uint8Array {
    const entry = store.get(normalizeKey(this.uri));
    if (!entry || entry.kind !== 'file' || !entry.exists) {
      throw new Error('File does not exist');
    }
    return entry.bytes ?? new Uint8Array(0);
  }

  textSync(): string {
    return utf8Decode(this.readBytesOrThrow());
  }

  base64Sync(): string {
    return base64Encode(this.readBytesOrThrow());
  }

  bytesSync(): Uint8Array {
    return new Uint8Array(this.readBytesOrThrow());
  }

  async text(): Promise<string> {
    return this.textSync();
  }

  async base64(): Promise<string> {
    return this.base64Sync();
  }

  async bytes(): Promise<Uint8Array> {
    return this.bytesSync();
  }

  info(options: { md5?: boolean } = {}): any {
    const entry = store.get(normalizeKey(this.uri));
    if (!entry || entry.kind !== 'file' || !entry.exists) {
      return { exists: false, uri: this.uri };
    }
    const size = entry.bytes?.length ?? 0;
    return {
      exists: true,
      uri: this.uri,
      size,
      ...(options.md5 ? { md5: fakeMd5(this.uri, size) } : {}),
    };
  }

  open(mode: number | string = 0): FileSystemFileHandle {
    const key = normalizeKey(this.uri);
    const entry = store.get(key);
    if (!entry || entry.kind !== 'file' || !entry.exists) {
      throw new Error('File does not exist');
    }
    return new FileSystemFileHandle(key, mode);
  }

  delete(): void {
    const key = normalizeKey(this.uri);
    const entry = store.get(key);
    if (!entry || !entry.exists) {
      throw new Error('File does not exist');
    }
    store.delete(key);
  }

  private resolveDestination(destination: FileSystemFile | FileSystemDirectory): string {
    if (destination instanceof FileSystemDirectory) {
      return joinUri(destination.uri, basename(this.uri));
    }
    return normalizeKey(destination.uri);
  }

  copySync(
    destination: FileSystemFile | FileSystemDirectory,
    options: { overwrite?: boolean } = {}
  ): void {
    const srcKey = normalizeKey(this.uri);
    const entry = store.get(srcKey);
    if (!entry || entry.kind !== 'file' || !entry.exists) {
      throw new Error('File does not exist');
    }
    const destKey = this.resolveDestination(destination);
    const destExisting = store.get(destKey);
    if (destExisting?.exists && !options.overwrite) {
      throw new Error('Destination already exists');
    }
    assertParent(destKey, false);
    store.set(destKey, {
      kind: 'file',
      bytes: new Uint8Array(entry.bytes ?? new Uint8Array(0)),
      type: entry.type ?? null,
      exists: true,
    });
  }

  async copy(
    destination: FileSystemFile | FileSystemDirectory,
    options: { overwrite?: boolean } = {}
  ): Promise<void> {
    this.copySync(destination, options);
  }

  moveSync(
    destination: FileSystemFile | FileSystemDirectory,
    options: { overwrite?: boolean } = {}
  ): void {
    const srcKey = normalizeKey(this.uri);
    this.copySync(destination, options);
    const destKey = this.resolveDestination(destination);
    if (destKey !== srcKey) {
      store.delete(srcKey);
    }
    this.uri = destKey;
  }

  async move(
    destination: FileSystemFile | FileSystemDirectory,
    options: { overwrite?: boolean } = {}
  ): Promise<void> {
    this.moveSync(destination, options);
  }

  rename(newName: string): void {
    const srcKey = normalizeKey(this.uri);
    const entry = store.get(srcKey);
    if (!entry || !entry.exists) {
      throw new Error('File does not exist');
    }
    const destKey = joinUri(parentOf(this.uri), newName);
    store.set(destKey, entry);
    store.delete(srcKey);
    this.uri = destKey;
  }
}

export class FileSystemFileHandle {
  private readonly key: string;
  private readonly readOnly: boolean;
  private readonly writeOnly: boolean;
  private cursor: number;
  private closed = false;

  constructor(key: string, mode: number | string) {
    this.key = key;
    const modeStr = typeof mode === 'string' ? mode : MODE_NAMES[mode] ?? 'readwrite';
    this.readOnly = modeStr === 'read';
    this.writeOnly = modeStr === 'write';
    const entry = store.get(key);
    if (modeStr === 'truncate') {
      store.set(key, { kind: 'file', bytes: new Uint8Array(0), exists: true });
      this.cursor = 0;
    } else if (modeStr === 'append') {
      this.cursor = entry?.bytes?.length ?? 0;
    } else {
      this.cursor = 0;
    }
  }

  private ensureOpen() {
    if (this.closed) throw new Error('File handle is closed');
  }

  readBytes(count: number): Uint8Array {
    this.ensureOpen();
    if (this.writeOnly) throw new Error('File handle is write-only');
    const entry = store.get(this.key);
    const bytes = entry?.bytes ?? new Uint8Array(0);
    const slice = bytes.slice(this.cursor, this.cursor + count);
    this.cursor += slice.length;
    return slice;
  }

  writeBytes(buffer: Uint8Array): void {
    this.ensureOpen();
    if (this.readOnly) throw new Error('File handle is read-only');
    const entry = store.get(this.key) ?? { kind: 'file' as const, bytes: new Uint8Array(0), exists: true };
    const prior = entry.bytes ?? new Uint8Array(0);
    const newLength = Math.max(prior.length, this.cursor + buffer.length);
    const merged = new Uint8Array(newLength);
    merged.set(prior, 0);
    merged.set(buffer, this.cursor);
    store.set(this.key, { ...entry, kind: 'file', bytes: merged, exists: true });
    this.cursor += buffer.length;
  }

  close(): void {
    this.closed = true;
  }
}

// FileMode enum values from src/ExpoFileSystem.types.ts — keep as numbers but
// map by name so callers using either work.
const MODE_NAMES: Record<number, string> = {
  0: 'readwrite',
  1: 'read',
  2: 'write',
  3: 'append',
  4: 'truncate',
};

export class FileSystemDirectory {
  uri: string;

  constructor(uri: string) {
    this.uri = uri;
  }

  validatePath(): void {}

  get exists(): boolean {
    const entry = store.get(normalizeKey(this.uri));
    return !!(entry && entry.kind === 'dir' && entry.exists);
  }

  info(): any {
    const entry = store.get(normalizeKey(this.uri));
    if (!entry || entry.kind !== 'dir' || !entry.exists) {
      return { exists: false, uri: this.uri };
    }
    return {
      exists: true,
      uri: this.uri,
      files: directChildren(this.uri).map((child) => child.uri),
    };
  }

  create(
    options: { intermediates?: boolean; idempotent?: boolean; overwrite?: boolean } = {}
  ): void {
    const key = normalizeKey(this.uri);
    const existing = store.get(key);
    if (existing?.exists) {
      if (options.idempotent) return;
      if (!options.overwrite) {
        throw new Error('Directory already exists');
      }
      deleteSubtree(key);
    }
    assertParent(this.uri, !!options.intermediates);
    store.set(key, { kind: 'dir', exists: true });
  }

  delete(): void {
    const key = normalizeKey(this.uri);
    const entry = store.get(key);
    if (!entry || !entry.exists) {
      throw new Error('Directory does not exist');
    }
    deleteSubtree(key);
  }

  listAsRecords(): { isDirectory: boolean; uri: string }[] {
    const entry = store.get(normalizeKey(this.uri));
    if (!entry || entry.kind !== 'dir' || !entry.exists) {
      throw new Error('Directory does not exist');
    }
    return directChildren(this.uri).map(({ uri, kind }) => ({
      isDirectory: kind === 'dir',
      uri,
    }));
  }

  createFile(name: string, mimeType: string | null): FileSystemFile {
    const parentKey = normalizeKey(this.uri);
    const parent = store.get(parentKey);
    if (!parent || parent.kind !== 'dir' || !parent.exists) {
      throw new Error('Parent directory does not exist');
    }
    const childKey = joinUri(this.uri, name);
    if (store.get(childKey)?.exists) {
      throw new Error('File already exists');
    }
    store.set(childKey, {
      kind: 'file',
      bytes: new Uint8Array(0),
      type: mimeType ?? null,
      exists: true,
    });
    return new FileSystemFile(childKey);
  }

  createDirectory(name: string): FileSystemDirectory {
    const parentKey = normalizeKey(this.uri);
    const parent = store.get(parentKey);
    if (!parent || parent.kind !== 'dir' || !parent.exists) {
      throw new Error('Parent directory does not exist');
    }
    const childKey = joinUri(this.uri, name);
    if (store.get(childKey)?.exists) {
      throw new Error('Directory already exists');
    }
    store.set(childKey, { kind: 'dir', exists: true });
    return new FileSystemDirectory(childKey);
  }

  private resolveDestination(destination: FileSystemFile | FileSystemDirectory): string {
    if (destination instanceof FileSystemDirectory) {
      return joinUri(destination.uri, basename(this.uri));
    }
    return normalizeKey(destination.uri);
  }

  copySync(
    destination: FileSystemFile | FileSystemDirectory,
    options: { overwrite?: boolean } = {}
  ): void {
    const srcKey = normalizeKey(this.uri);
    const entry = store.get(srcKey);
    if (!entry || entry.kind !== 'dir' || !entry.exists) {
      throw new Error('Directory does not exist');
    }
    const destKey = this.resolveDestination(destination);
    const destExisting = store.get(destKey);
    if (destExisting?.exists && !options.overwrite) {
      throw new Error('Destination already exists');
    }
    assertParent(destKey, false);
    copySubtree(srcKey, destKey);
  }

  async copy(
    destination: FileSystemFile | FileSystemDirectory,
    options: { overwrite?: boolean } = {}
  ): Promise<void> {
    this.copySync(destination, options);
  }

  moveSync(
    destination: FileSystemFile | FileSystemDirectory,
    options: { overwrite?: boolean } = {}
  ): void {
    const srcKey = normalizeKey(this.uri);
    this.copySync(destination, options);
    const destKey = this.resolveDestination(destination);
    if (destKey !== srcKey) {
      deleteSubtree(srcKey);
    }
    this.uri = destKey;
  }

  async move(
    destination: FileSystemFile | FileSystemDirectory,
    options: { overwrite?: boolean } = {}
  ): Promise<void> {
    this.moveSync(destination, options);
  }

  rename(newName: string): void {
    const srcKey = normalizeKey(this.uri);
    const entry = store.get(srcKey);
    if (!entry || !entry.exists) {
      throw new Error('Directory does not exist');
    }
    const destKey = joinUri(parentOf(this.uri), newName);
    copySubtree(srcKey, destKey);
    deleteSubtree(srcKey);
    this.uri = destKey;
  }
}

function directChildren(dirUri: string): { uri: string; kind: 'file' | 'dir' }[] {
  const prefix = `${normalizeKey(dirUri)}/`;
  const result: { uri: string; kind: 'file' | 'dir' }[] = [];
  for (const [key, entry] of store) {
    if (!entry.exists || !key.startsWith(prefix)) continue;
    const tail = key.slice(prefix.length);
    if (tail.length === 0 || tail.includes('/')) continue;
    result.push({ uri: key, kind: entry.kind });
  }
  return result;
}

function deleteSubtree(rootKey: string) {
  const prefix = `${rootKey}/`;
  const keys: string[] = [rootKey];
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) keys.push(key);
  }
  for (const key of keys) store.delete(key);
}

function copySubtree(srcKey: string, destKey: string) {
  const srcEntry = store.get(srcKey);
  if (!srcEntry) return;
  store.set(destKey, cloneEntry(srcEntry));
  const prefix = `${srcKey}/`;
  for (const [key, entry] of store) {
    if (!key.startsWith(prefix)) continue;
    const rewritten = destKey + key.slice(srcKey.length);
    store.set(rewritten, cloneEntry(entry));
  }
}

function cloneEntry(entry: Entry): Entry {
  return {
    kind: entry.kind,
    exists: entry.exists,
    type: entry.type ?? null,
    bytes: entry.bytes ? new Uint8Array(entry.bytes) : undefined,
  };
}

export async function downloadFileAsync(
  url: URL,
  to: { uri: string } | undefined,
  options: any,
  uuid: string | undefined
): Promise<string> {
  if (options?.signal?.aborted) {
    const err = new Error(options.signal.reason ?? 'The operation was aborted.');
    err.name = 'AbortError';
    throw err;
  }
  const bytes = utf8Encode(`mock:${url}`);
  const toUri = to?.uri ?? joinUri(cacheDirectory, basename(url));
  const toEntry = store.get(normalizeKey(toUri));
  const destKey = toEntry?.kind === 'dir' ? joinUri(toUri, basename(url)) : normalizeKey(toUri);

  if (uuid) {
    emit('downloadProgress', {
      uuid,
      data: { bytesWritten: bytes.length, totalBytes: bytes.length },
    });
  }

  if (uuid && cancelled.has(uuid)) {
    cancelled.delete(uuid);
    const err = new Error('Download was cancelled.');
    err.name = 'AbortError';
    throw err;
  }

  store.set(destKey, { kind: 'file', bytes, exists: true });
  return destKey;
}

export function cancelDownloadAsync(uuid: string): void {
  cancelled.add(uuid);
}

export async function pickDirectoryAsync(_initialUri?: string): Promise<{ uri: string }> {
  return { uri: 'file:///mock/picked/directory' };
}

export async function pickFileAsync(options?: any): Promise<any> {
  if (options?.multipleFiles) {
    return [{ uri: 'file:///mock/picked/file1.txt' }, { uri: 'file:///mock/picked/file2.txt' }];
  }
  return { uri: 'file:///mock/picked/file.txt' };
}

// SharedObject-based task classes.
// In the test environment the polyfill `SharedObject` (which provides a working
// EventEmitter with `addListener`/`emit`) is installed on `globalThis.expo`
// by jest-expo's setup *before* mock modules are loaded.
// We extend it so that the JS subclasses (`UploadTask` / `DownloadTask`) can
// call `this.addListener(...)` and friends.

const { SharedObject } = globalThis.expo;

export class FileSystemUploadTask extends SharedObject {
  start(_url: string, _file: any, _options: any): Promise<any> {
    return Promise.resolve({ body: '', status: 200, headers: {} });
  }
  cancel(): void {}
}

export class FileSystemDownloadTask extends SharedObject {
  start(_url: string, _to: any, _options?: any): Promise<string | null> {
    return Promise.resolve('file:///mock/downloaded-file');
  }
  pause(): { resumeData: string } {
    return { resumeData: 'mock-resume-data' };
  }
  resume(
    _url: string,
    _to: any,
    _resumeData: string,
    _options?: any
  ): Promise<string | null> {
    return Promise.resolve('file:///mock/downloaded-file');
  }
  cancel(): void {}
}
