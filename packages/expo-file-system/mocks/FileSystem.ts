/**
 * Hand-maintained mock for the FileSystem native module.
 *
 * Backs the class-based API (`File`, `Directory`, `Paths` from
 * `expo-file-system`) with a small in-memory filesystem so tests can exercise
 * create/write/read/move/copy/delete end-to-end. This module is what
 * `jest-expo`'s preset feeds to `requireNativeModule('FileSystem')`.
 * Timestamps use a logical clock reset by `__resetMockFileSystem()`; do not use
 * `Date.now()` here.
 *
 * DO NOT regenerate this file with `expo-modules-test-core` — the generator
 * emits a bare stub and will overwrite the behavior here. Same pattern as
 * `packages/expo-crypto/mocks/ExpoCryptoAES.ts`.
 */

import { FileMode } from '../src/File.types';

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
  createdAt?: number;
  modifiedAt?: number;
};

const store = new Map<string, Entry>();

const SEED_DIRS = [documentDirectory, cacheDirectory, bundleDirectory];

function seed() {
  const t = nextMockTimestamp();
  for (const uri of SEED_DIRS) {
    store.set(normalizeKey(uri), { kind: 'dir', exists: true, createdAt: t, modifiedAt: t });
  }
}

/**
 * Logical clock used for `createdAt` / `modifiedAt` on stored entries.
 * Resetting the mock filesystem also resets it so each test sees a stable
 * sequence of timestamps independent of wall-clock time.
 */
let mockClock = 0;

function nextMockTimestamp(): number {
  return ++mockClock;
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
  mockClock = 0;
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
  const now = nextMockTimestamp();
  for (const dirKey of missing) {
    store.set(dirKey, { kind: 'dir', exists: true, createdAt: now, modifiedAt: now });
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

  get size(): number {
    const entry = store.get(normalizeKey(this.uri));
    return entry && entry.kind === 'file' && entry.exists ? (entry.bytes?.length ?? 0) : 0;
  }

  get type(): string {
    const entry = store.get(normalizeKey(this.uri));
    return entry?.type ?? '';
  }

  get md5(): string | null {
    return this.exists ? fakeMd5(this.uri, this.size) : null;
  }

  get modificationTime(): number | null {
    const entry = store.get(normalizeKey(this.uri));
    return entry?.exists ? (entry.modifiedAt ?? null) : null;
  }

  get lastModified(): number | null {
    return this.modificationTime;
  }

  get creationTime(): number | null {
    const entry = store.get(normalizeKey(this.uri));
    return entry?.exists ? (entry.createdAt ?? null) : null;
  }

  get contentUri(): string {
    return '';
  }

  canPreview(): Promise<boolean> {
    return Promise.resolve(this.exists);
  }

  preview(): Promise<void> {
    return this.exists ? Promise.resolve() : Promise.reject(new Error('File does not exist'));
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
    const now = nextMockTimestamp();
    store.set(key, {
      kind: 'file',
      bytes: new Uint8Array(0),
      exists: true,
      createdAt: now,
      modifiedAt: now,
    });
  }

  writeSync(
    content: string | Uint8Array | ArrayBuffer,
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
    const existing = store.get(key);
    const now = nextMockTimestamp();
    const createdAt = existing?.exists ? (existing.createdAt ?? now) : now;
    const type = existing?.type ?? null;
    if (options.append) {
      const prior = existing?.bytes ?? new Uint8Array(0);
      const merged = new Uint8Array(prior.length + bytes.length);
      merged.set(prior, 0);
      merged.set(bytes, prior.length);
      store.set(key, {
        kind: 'file',
        bytes: merged,
        type,
        exists: true,
        createdAt,
        modifiedAt: now,
      });
    } else {
      store.set(key, { kind: 'file', bytes, type, exists: true, createdAt, modifiedAt: now });
    }
  }

  async write(
    content: string | Uint8Array | ArrayBuffer,
    options: { append?: boolean; encoding?: 'utf8' | 'base64' } = {}
  ): Promise<void> {
    this.writeSync(content, options);
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

  infoSync(options: { md5?: boolean } = {}): any {
    const entry = store.get(normalizeKey(this.uri));
    if (!entry || entry.kind !== 'file' || !entry.exists) {
      return { exists: false, uri: this.uri };
    }
    const size = entry.bytes?.length ?? 0;
    return {
      exists: true,
      uri: this.uri,
      size,
      modificationTime: entry.modifiedAt ?? null,
      creationTime: entry.createdAt ?? null,
      ...(options.md5 ? { md5: fakeMd5(this.uri, size) } : {}),
    };
  }

  async info(options: { md5?: boolean } = {}): Promise<any> {
    return this.infoSync(options);
  }

  async getMd5Async(): Promise<string> {
    if (!this.exists) {
      throw new Error('Cannot read file');
    }
    return this.md5!;
  }

  open(mode?: FileMode): FileSystemFileHandle {
    const key = normalizeKey(this.uri);
    const entry = store.get(key);
    if (!entry || entry.kind !== 'file' || !entry.exists) {
      throw new Error('File does not exist');
    }
    return new FileSystemFileHandle(key, mode ?? defaultModeForUri(this.uri));
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
    const now = nextMockTimestamp();
    store.set(destKey, {
      kind: 'file',
      bytes: new Uint8Array(entry.bytes ?? new Uint8Array(0)),
      type: entry.type ?? null,
      exists: true,
      createdAt: now,
      modifiedAt: now,
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

  watch(_callback: any, _options?: any): { remove: () => void } {
    return { remove: () => {} };
  }
}

export class FileSystemFileHandle {
  private readonly key: string;
  private readonly readOnly: boolean;
  private readonly writeOnly: boolean;
  private cursor: number;
  private closed = false;

  constructor(key: string, mode: FileMode) {
    this.key = key;
    const entry = store.get(key);
    switch (mode) {
      case FileMode.ReadWrite:
        this.readOnly = false;
        this.writeOnly = false;
        this.cursor = 0;
        break;
      case FileMode.ReadOnly:
        this.readOnly = true;
        this.writeOnly = false;
        this.cursor = 0;
        break;
      case FileMode.WriteOnly:
        this.readOnly = false;
        this.writeOnly = true;
        this.cursor = 0;
        break;
      case FileMode.Append:
        this.readOnly = false;
        this.writeOnly = true;
        this.cursor = entry?.bytes?.length ?? 0;
        break;
      case FileMode.Truncate:
        this.readOnly = false;
        this.writeOnly = true;
        store.set(key, {
          kind: 'file',
          bytes: new Uint8Array(0),
          type: entry?.type ?? null,
          exists: true,
          createdAt: entry?.createdAt ?? nextMockTimestamp(),
          modifiedAt: nextMockTimestamp(),
        });
        this.cursor = 0;
        break;
      default:
        assertNever(mode);
    }
  }

  private ensureOpen() {
    if (this.closed) throw new Error('File handle is closed');
  }

  get offset(): number | null {
    return this.closed ? null : this.cursor;
  }

  set offset(value: number | null) {
    if (this.closed || value == null) {
      return;
    }
    this.cursor = value;
  }

  get size(): number | null {
    if (this.closed) {
      return null;
    }
    const entry = store.get(this.key);
    return entry?.bytes?.length ?? 0;
  }

  readBytesSync(count: number): Uint8Array {
    this.ensureOpen();
    if (this.writeOnly) throw new Error('File handle is write-only');
    const entry = store.get(this.key);
    const bytes = entry?.bytes ?? new Uint8Array(0);
    const slice = bytes.slice(this.cursor, this.cursor + count);
    this.cursor += slice.length;
    return slice;
  }

  async readBytes(count: number): Promise<Uint8Array> {
    return this.readBytesSync(count);
  }

  writeBytesSync(buffer: Uint8Array): void {
    this.ensureOpen();
    if (this.readOnly) throw new Error('File handle is read-only');
    const entry = store.get(this.key) ?? {
      kind: 'file' as const,
      bytes: new Uint8Array(0),
      exists: true,
    };
    const prior = entry.bytes ?? new Uint8Array(0);
    const writeOffset = Math.min(this.cursor, prior.length);
    const newLength = Math.max(prior.length, writeOffset + buffer.length);
    const merged = new Uint8Array(newLength);
    merged.set(prior, 0);
    merged.set(buffer, writeOffset);
    store.set(this.key, {
      ...entry,
      kind: 'file',
      bytes: merged,
      exists: true,
      modifiedAt: nextMockTimestamp(),
    });
    this.cursor = writeOffset + buffer.length;
  }

  async writeBytes(buffer: Uint8Array): Promise<void> {
    this.writeBytesSync(buffer);
  }

  close(): void {
    this.closed = true;
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled FileMode in jest-expo mock: ${String(value)}`);
}

function defaultModeForUri(uri: string): FileMode {
  return uri.startsWith('content://') ? FileMode.ReadOnly : FileMode.ReadWrite;
}

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

  get size(): number | null {
    const entry = store.get(normalizeKey(this.uri));
    if (!entry || entry.kind !== 'dir' || !entry.exists) {
      return null;
    }
    const prefix = `${normalizeKey(this.uri)}/`;
    let total = 0;
    for (const [key, e] of store) {
      if (!e.exists || e.kind !== 'file' || !key.startsWith(prefix)) continue;
      total += e.bytes?.length ?? 0;
    }
    return total;
  }

  info(): any {
    const entry = store.get(normalizeKey(this.uri));
    if (!entry || entry.kind !== 'dir' || !entry.exists) {
      return { exists: false, uri: this.uri };
    }
    return {
      exists: true,
      uri: this.uri,
      files: directChildren(this.uri).map((child) => basename(child.uri)),
      size: this.size,
      modificationTime: entry.modifiedAt ?? null,
      creationTime: entry.createdAt ?? null,
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
    const now = nextMockTimestamp();
    store.set(key, { kind: 'dir', exists: true, createdAt: now, modifiedAt: now });
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
    const now = nextMockTimestamp();
    store.set(childKey, {
      kind: 'file',
      bytes: new Uint8Array(0),
      type: mimeType ?? null,
      exists: true,
      createdAt: now,
      modifiedAt: now,
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
    const now = nextMockTimestamp();
    store.set(childKey, { kind: 'dir', exists: true, createdAt: now, modifiedAt: now });
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

  watch(_callback: any, _options?: any): { remove: () => void } {
    return { remove: () => {} };
  }
}

export class FileSystemWatcher {
  constructor(_path: string, _options?: { debounce?: number; events?: string[] }) {}
  addListener(_event: string, _callback: (data: any) => void): { remove: () => void } {
    return { remove: () => {} };
  }
  start(): void {}
  stop(): void {}
}

// Native task handle mocks.
// In the test environment the polyfill `SharedObject` is installed on
// `globalThis.expo` by jest-expo's setup before mock modules are loaded.
// Public `UploadTask` / `DownloadTask` instances compose these native handles,
// so the handles provide SharedObject APIs while the public tasks expose only
// their explicit facade methods.

// Annotate explicitly: the inferred type of the destructured constructor
// otherwise references expo-modules-core's internal declaration path, which is
// not portable in the emitted (composite) declarations.
const SharedObject: (typeof globalThis.expo)['SharedObject'] = globalThis.expo.SharedObject;

export class FileSystemUploadTask extends SharedObject {
  start(_url: string, _file: any, _options: any): Promise<any> {
    return Promise.resolve({ body: '', status: 200, headers: {} });
  }
  release(): void {
    super.release();
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
  resume(_url: string, _to: any, _resumeData: string, _options?: any): Promise<string | null> {
    return Promise.resolve('file:///mock/downloaded-file');
  }
  release(): void {
    super.release();
  }
  cancel(): void {}
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
  const now = nextMockTimestamp();
  store.set(destKey, cloneEntry(srcEntry, now));
  const prefix = `${srcKey}/`;
  for (const [key, entry] of store) {
    if (!key.startsWith(prefix)) continue;
    const rewritten = destKey + key.slice(srcKey.length);
    store.set(rewritten, cloneEntry(entry, now));
  }
}

function cloneEntry(entry: Entry, timestamp: number): Entry {
  return {
    kind: entry.kind,
    exists: entry.exists,
    type: entry.type ?? null,
    bytes: entry.bytes ? new Uint8Array(entry.bytes) : undefined,
    createdAt: timestamp,
    modifiedAt: timestamp,
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

  const now = nextMockTimestamp();
  store.set(destKey, { kind: 'file', bytes, exists: true, createdAt: now, modifiedAt: now });
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
