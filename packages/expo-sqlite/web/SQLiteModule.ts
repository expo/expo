// Copyright 2015-present 650 Industries. All rights reserved.

import { registerWebModule, NativeModule, UnavailabilityError } from 'expo';

import { type SQLiteOpenOptions } from '../src/NativeDatabase';
import { type Changeset, type NativeChangeset } from '../src/NativeSession';
import {
  type SQLiteBindBlobParams,
  type SQLiteBindPrimitiveParams,
  type SQLiteColumnNames,
  type SQLiteColumnValues,
  type SQLiteRunResult,
} from '../src/NativeStatement';
import { type SQLiteWebOptions } from '../src/WebConfiguration';
import {
  assertSyncWorkerCanPost,
  beginSyncWorkerLoadRetry,
  invokeWorkerAsync,
  invokeWorkerSync,
  markSQLiteWebWorkerReady,
  SYNC_WORKER_NOT_READY_MESSAGE,
  workerMessageHandler,
} from './WorkerChannel';
import {
  type ConfigureWorkerMessage,
  type InitWorkerMessage,
  type ShutdownWorkerMessage,
} from './web.types';

let worker: Worker | null = null;
let webOptions: SQLiteWebOptions = {};
let databaseOperationStarted = false;
let workerEpoch = 0;
let workerShutdown: Promise<void> | null = null;
let nextNativeDatabaseId = 0;
let nextNativeStatementId = 0;
let nextNativeSessionId = 0;

// A reloaded module, including a test, clears the previous schedule through this key.
const workerStartHandle = Symbol.for('expo-sqlite.webWorkerStart');

function cancelScheduledWorkerStart(): void {
  const globals = globalThis as typeof globalThis & {
    [workerStartHandle]?: ReturnType<typeof setTimeout>;
  };
  if (globals[workerStartHandle] != null) {
    clearTimeout(globals[workerStartHandle]);
    delete globals[workerStartHandle];
  }
}

function scheduleWorkerStart(): void {
  if (worker != null || typeof window === 'undefined') {
    return;
  }
  const globals = globalThis as typeof globalThis & {
    [workerStartHandle]?: ReturnType<typeof setTimeout>;
  };
  if (globals[workerStartHandle] != null) {
    return;
  }
  // The next turn lets configureWeb() in this turn choose the wasm URL.
  globals[workerStartHandle] = setTimeout(() => {
    delete globals[workerStartHandle];
    if (worker == null && typeof Worker === 'function') {
      createWorker();
    }
  }, 0);
}

function createWorker(): Worker {
  cancelScheduledWorkerStart();
  if (!worker) {
    const epoch = ++workerEpoch;
    worker = new Worker(new URL('./worker', window.location.href));
    worker.addEventListener('message', (event) => {
      if (epoch !== workerEpoch) {
        return;
      }
      if (event.data?.type === 'workerReady') {
        markSQLiteWebWorkerReady(event.data.error ? { error: event.data.error } : 'ready');
        return;
      }
      if (event.data.type === 'onDatabaseChange') {
        // @ts-expect-error EventEmitter type for NativeModule is not inferred correctly on web.
        SQLiteModuleInstance.emit(event.data.type, event.data.data);
        return;
      }
      workerMessageHandler(event);
    });
    worker.postMessage({ type: 'configure', data: webOptions } satisfies ConfigureWorkerMessage);
    worker.postMessage({ type: 'init' } satisfies InitWorkerMessage);
  }
  return worker;
}

function getWorker(): Worker {
  // The old worker still owns the database files until it posts workerShutdown.
  if (workerShutdown != null) {
    throw new Error(SYNC_WORKER_NOT_READY_MESSAGE);
  }
  // The wasm load already failed. Post init again and return.
  // The worker can fetch wasm only while this call is not spinning.
  if (beginSyncWorkerLoadRetry()) {
    const current = worker;
    if (current == null) {
      createWorker();
    } else {
      current.postMessage({ type: 'init' } satisfies InitWorkerMessage);
    }
    throw new Error(SYNC_WORKER_NOT_READY_MESSAGE);
  }
  // This call throws before it posts, so it has not opened a database.
  // configureWeb() can still replace the worker.
  assertSyncWorkerCanPost();
  databaseOperationStarted = true;
  return createWorker();
}

async function getWorkerAsync(): Promise<Worker> {
  if (workerShutdown != null) {
    await workerShutdown;
  }
  databaseOperationStarted = true;
  return createWorker();
}

function discardPreloadedWorker(): void {
  const current = worker;
  workerEpoch += 1;
  worker = null;
  markSQLiteWebWorkerReady('loading');
  if (current == null) {
    return;
  }
  // terminate() does not close OPFS sync access handles.
  // Wait until the worker closes them before the replacement opens the same files.
  workerShutdown = new Promise((resolve) => {
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type !== 'workerShutdown') {
        return;
      }
      current.removeEventListener('message', onMessage);
      current.terminate();
      workerShutdown = null;
      scheduleWorkerStart();
      resolve();
    };
    current.addEventListener('message', onMessage);
    current.postMessage({ type: 'shutdown' } satisfies ShutdownWorkerMessage);
  });
}

// web worker works on Uint8Array, but session methods accept ArrayBuffer too
function convertChangesetInput(changeset: Changeset | NativeChangeset): Changeset {
  return ArrayBuffer.isView(changeset) ? changeset : new Uint8Array(changeset);
}

class NativeDatabase {
  public readonly id: number;

  constructor(
    public readonly databasePath: string,
    public readonly options?: SQLiteOpenOptions,
    private serializedData?: Uint8Array
  ) {
    this.id = nextNativeDatabaseId++;
  }

  async initAsync(): Promise<void> {
    await invokeWorkerAsync(await getWorkerAsync(), 'open', {
      nativeDatabaseId: this.id,
      databasePath: this.databasePath,
      options: this.options ?? {},
      serializedData: this.serializedData,
    });
  }
  initSync(): void {
    invokeWorkerSync(getWorker(), 'open', {
      nativeDatabaseId: this.id,
      databasePath: this.databasePath,
      options: this.options ?? {},
      serializedData: this.serializedData,
    });
  }

  async isInTransactionAsync(): Promise<boolean> {
    return await invokeWorkerAsync(await getWorkerAsync(), 'isInTransaction', {
      nativeDatabaseId: this.id,
    });
  }
  isInTransactionSync(): boolean {
    return invokeWorkerSync(getWorker(), 'isInTransaction', {
      nativeDatabaseId: this.id,
    });
  }

  async closeAsync(): Promise<void> {
    await invokeWorkerAsync(await getWorkerAsync(), 'close', {
      nativeDatabaseId: this.id,
    });
  }
  interruptSync(): void {
    throw new UnavailabilityError('expo-sqlite', 'interruptSync');
  }

  closeSync(): void {
    invokeWorkerSync(getWorker(), 'close', {
      nativeDatabaseId: this.id,
    });
  }

  async execAsync(source: string): Promise<void> {
    await invokeWorkerAsync(await getWorkerAsync(), 'exec', {
      nativeDatabaseId: this.id,
      source,
    });
  }
  execSync(source: string): void {
    invokeWorkerSync(getWorker(), 'exec', {
      nativeDatabaseId: this.id,
      source,
    });
  }

  async serializeAsync(schemaName: string): Promise<Uint8Array> {
    return await invokeWorkerAsync(await getWorkerAsync(), 'serialize', {
      nativeDatabaseId: this.id,
      schemaName,
    });
  }
  serializeSync(schemaName: string): Uint8Array {
    return invokeWorkerSync(getWorker(), 'serialize', {
      nativeDatabaseId: this.id,
      schemaName,
    });
  }

  async prepareAsync(nativeStatement: NativeStatement, source: string): Promise<void> {
    await invokeWorkerAsync(await getWorkerAsync(), 'prepare', {
      nativeDatabaseId: this.id,
      nativeStatementId: nativeStatement.id,
      source,
    });
  }
  prepareSync(nativeStatement: NativeStatement, source: string): void {
    invokeWorkerSync(getWorker(), 'prepare', {
      nativeDatabaseId: this.id,
      nativeStatementId: nativeStatement.id,
      source,
    });
  }
  async createSessionAsync(nativeSession: NativeSession, dbName: string): Promise<void> {
    await invokeWorkerAsync(await getWorkerAsync(), 'sessionCreate', {
      nativeDatabaseId: this.id,
      nativeSessionId: nativeSession.id,
      dbName,
    });
  }
  createSessionSync(nativeSession: NativeSession, dbName: string): void {
    invokeWorkerSync(getWorker(), 'sessionCreate', {
      nativeDatabaseId: this.id,
      nativeSessionId: nativeSession.id,
      dbName,
    });
  }
  loadExtensionAsync(filePath: string, entryPoint?: string): Promise<void> {
    throw new Error('Not implemented on web');
  }
  loadExtensionSync(filePath: string, entryPoint?: string): void {
    throw new Error('Not implemented on web');
  }
}

class NativeStatement {
  public readonly id: number;

  constructor() {
    this.id = nextNativeStatementId++;
  }

  async runAsync(
    database: NativeDatabase,
    bindParams: SQLiteBindPrimitiveParams,
    bindBlobParams: SQLiteBindBlobParams,
    shouldPassAsArray: boolean
  ): Promise<SQLiteRunResult & { firstRowValues: SQLiteColumnValues }> {
    if (this.id == null) {
      throw new Error('Statement not prepared');
    }
    return await invokeWorkerAsync(await getWorkerAsync(), 'run', {
      nativeDatabaseId: database.id,
      nativeStatementId: this.id,
      bindParams,
      bindBlobParams,
      shouldPassAsArray,
    });
  }
  runSync(
    database: NativeDatabase,
    bindParams: SQLiteBindPrimitiveParams,
    bindBlobParams: SQLiteBindBlobParams,
    shouldPassAsArray: boolean
  ): SQLiteRunResult & { firstRowValues: SQLiteColumnValues } {
    if (this.id == null) {
      throw new Error('Statement not prepared');
    }
    return invokeWorkerSync(getWorker(), 'run', {
      nativeDatabaseId: database.id,
      nativeStatementId: this.id,
      bindParams,
      bindBlobParams,
      shouldPassAsArray,
    });
  }

  async stepAsync(database: NativeDatabase): Promise<SQLiteColumnValues | null> {
    if (this.id == null) {
      throw new Error('Statement not prepared');
    }
    return await invokeWorkerAsync(await getWorkerAsync(), 'step', {
      nativeDatabaseId: database.id,
      nativeStatementId: this.id,
    });
  }
  stepSync(database: NativeDatabase): SQLiteColumnValues | null {
    if (this.id == null) {
      throw new Error('Statement not prepared');
    }
    return invokeWorkerSync(getWorker(), 'step', {
      nativeDatabaseId: database.id,
      nativeStatementId: this.id,
    });
  }

  async getAllAsync(database: NativeDatabase): Promise<SQLiteColumnValues[]> {
    if (this.id == null) {
      throw new Error('Statement not prepared');
    }
    return await invokeWorkerAsync(await getWorkerAsync(), 'getAll', {
      nativeDatabaseId: database.id,
      nativeStatementId: this.id,
    });
  }
  getAllSync(database: NativeDatabase): SQLiteColumnValues[] {
    if (this.id == null) {
      throw new Error('Statement not prepared');
    }
    return invokeWorkerSync(getWorker(), 'getAll', {
      nativeDatabaseId: database.id,
      nativeStatementId: this.id,
    });
  }

  async resetAsync(database: NativeDatabase): Promise<void> {
    if (this.id == null) {
      throw new Error('Statement not prepared');
    }
    await invokeWorkerAsync(await getWorkerAsync(), 'reset', {
      nativeDatabaseId: database.id,
      nativeStatementId: this.id,
    });
  }
  resetSync(database: NativeDatabase): void {
    if (this.id == null) {
      throw new Error('Statement not prepared');
    }
    invokeWorkerSync(getWorker(), 'reset', {
      nativeDatabaseId: database.id,
      nativeStatementId: this.id,
    });
  }

  async getColumnNamesAsync(): Promise<SQLiteColumnNames> {
    if (this.id == null) {
      throw new Error('Statement not prepared');
    }
    return await invokeWorkerAsync(await getWorkerAsync(), 'getColumnNames', {
      nativeStatementId: this.id,
    });
  }
  getColumnNamesSync(): SQLiteColumnNames {
    if (this.id == null) {
      throw new Error('Statement not prepared');
    }
    return invokeWorkerSync(getWorker(), 'getColumnNames', {
      nativeStatementId: this.id,
    });
  }

  async finalizeAsync(database: NativeDatabase): Promise<void> {
    if (this.id == null) {
      throw new Error('Statement not prepared');
    }
    await invokeWorkerAsync(await getWorkerAsync(), 'finalize', {
      nativeDatabaseId: database.id,
      nativeStatementId: this.id,
    });
  }
  finalizeSync(database: NativeDatabase): void {
    if (this.id == null) {
      throw new Error('Statement not prepared');
    }
    invokeWorkerSync(getWorker(), 'finalize', {
      nativeDatabaseId: database.id,
      nativeStatementId: this.id,
    });
  }
}

export class NativeSession {
  public readonly id: number;

  constructor() {
    this.id = nextNativeSessionId++;
  }

  async attachAsync(database: NativeDatabase, table: string | null): Promise<void> {
    await invokeWorkerAsync(await getWorkerAsync(), 'sessionAttach', {
      nativeDatabaseId: database.id,
      nativeSessionId: this.id,
      table,
    });
  }
  attachSync(database: NativeDatabase, table: string | null): void {
    invokeWorkerSync(getWorker(), 'sessionAttach', {
      nativeDatabaseId: database.id,
      nativeSessionId: this.id,
      table,
    });
  }

  async enableAsync(database: NativeDatabase, enabled: boolean): Promise<void> {
    await invokeWorkerAsync(await getWorkerAsync(), 'sessionEnable', {
      nativeDatabaseId: database.id,
      nativeSessionId: this.id,
      enabled,
    });
  }
  enableSync(database: NativeDatabase, enabled: boolean): void {
    invokeWorkerSync(getWorker(), 'sessionEnable', {
      nativeDatabaseId: database.id,
      nativeSessionId: this.id,
      enabled,
    });
  }

  async closeAsync(database: NativeDatabase): Promise<void> {
    await invokeWorkerAsync(await getWorkerAsync(), 'sessionClose', {
      nativeDatabaseId: database.id,
      nativeSessionId: this.id,
    });
  }
  closeSync(database: NativeDatabase): void {
    invokeWorkerSync(getWorker(), 'sessionClose', {
      nativeDatabaseId: database.id,
      nativeSessionId: this.id,
    });
  }

  async createChangesetAsync(database: NativeDatabase): Promise<NativeChangeset> {
    const result = await invokeWorkerAsync(await getWorkerAsync(), 'sessionCreateChangeset', {
      nativeDatabaseId: database.id,
      nativeSessionId: this.id,
    });
    return result.buffer as ArrayBuffer;
  }
  createChangesetSync(database: NativeDatabase): NativeChangeset {
    const result = invokeWorkerSync(getWorker(), 'sessionCreateChangeset', {
      nativeDatabaseId: database.id,
      nativeSessionId: this.id,
    });
    return result.buffer as ArrayBuffer;
  }

  async createInvertedChangesetAsync(database: NativeDatabase): Promise<NativeChangeset> {
    const result = await invokeWorkerAsync(
      await getWorkerAsync(),
      'sessionCreateInvertedChangeset',
      {
        nativeDatabaseId: database.id,
        nativeSessionId: this.id,
      }
    );
    return result.buffer as ArrayBuffer;
  }
  createInvertedChangesetSync(database: NativeDatabase): NativeChangeset {
    const result = invokeWorkerSync(getWorker(), 'sessionCreateInvertedChangeset', {
      nativeDatabaseId: database.id,
      nativeSessionId: this.id,
    });
    return result.buffer as ArrayBuffer;
  }

  async applyChangesetAsync(
    database: NativeDatabase,
    changeset: Changeset | NativeChangeset
  ): Promise<void> {
    await invokeWorkerAsync(await getWorkerAsync(), 'sessionApplyChangeset', {
      nativeDatabaseId: database.id,
      nativeSessionId: this.id,
      changeset: convertChangesetInput(changeset),
    });
  }
  applyChangesetSync(database: NativeDatabase, changeset: Changeset | NativeChangeset): void {
    invokeWorkerSync(getWorker(), 'sessionApplyChangeset', {
      nativeDatabaseId: database.id,
      nativeSessionId: this.id,
      changeset: convertChangesetInput(changeset),
    });
  }

  async invertChangesetAsync(
    database: NativeDatabase,
    changeset: Changeset | NativeChangeset
  ): Promise<NativeChangeset> {
    const result = await invokeWorkerAsync(await getWorkerAsync(), 'sessionInvertChangeset', {
      nativeDatabaseId: database.id,
      nativeSessionId: this.id,
      changeset: convertChangesetInput(changeset),
    });
    return result.buffer as ArrayBuffer;
  }
  invertChangesetSync(
    database: NativeDatabase,
    changeset: Changeset | NativeChangeset
  ): NativeChangeset {
    const result = invokeWorkerSync(getWorker(), 'sessionInvertChangeset', {
      nativeDatabaseId: database.id,
      nativeSessionId: this.id,
      changeset: convertChangesetInput(changeset),
    });
    return result.buffer as ArrayBuffer;
  }
}

export class SQLiteModule extends NativeModule {
  readonly defaultDatabaseDirectory = '.';
  readonly bundledExtensions = {};

  async deleteDatabaseAsync(databasePath: string): Promise<void> {
    await invokeWorkerAsync(await getWorkerAsync(), 'deleteDatabase', {
      databasePath,
    });
  }
  deleteDatabaseSync(databasePath: string): void {
    invokeWorkerSync(getWorker(), 'deleteDatabase', {
      databasePath,
    });
  }

  configureWeb(options: SQLiteWebOptions): void {
    // Fast Refresh runs the same call again after a database is open.
    if (options.wasmURL === webOptions.wasmURL && (worker != null || databaseOperationStarted)) {
      return;
    }
    if (databaseOperationStarted) {
      throw new Error(
        'Cannot change the SQLite WebAssembly URL because a database has already been opened, and the web worker loads SQLite only once. ' +
          'Call `configureWeb()` before opening any database, and reload the app after you change `wasmURL`.'
      );
    }
    webOptions = { ...options };
    // The preloaded worker loaded the previous wasm URL. No database is open, so start again.
    if (worker != null) {
      discardPreloadedWorker();
    }
  }

  async ensureDatabasePathExistsAsync(databasePath: string): Promise<void> {
    // No-op for web
  }
  ensureDatabasePathExistsSync(databasePath: string): void {
    // No-op for web
  }

  async backupDatabaseAsync(
    destDatabase: NativeDatabase,
    destDatabaseName: string,
    sourceDatabase: NativeDatabase,
    sourceDatabaseName: string
  ): Promise<void> {
    await invokeWorkerAsync(await getWorkerAsync(), 'backupDatabase', {
      destNativeDatabaseId: destDatabase.id,
      destDatabaseName,
      sourceNativeDatabaseId: sourceDatabase.id,
      sourceDatabaseName,
    });
  }
  backupDatabaseSync(
    destDatabase: NativeDatabase,
    destDatabaseName: string,
    sourceDatabase: NativeDatabase,
    sourceDatabaseName: string
  ): void {
    invokeWorkerSync(getWorker(), 'backupDatabase', {
      destNativeDatabaseId: destDatabase.id,
      destDatabaseName,
      sourceNativeDatabaseId: sourceDatabase.id,
      sourceDatabaseName,
    });
  }

  async importAssetDatabaseAsync(
    databasePath: string,
    assetDatabasePath: string,
    forceOverwrite: boolean
  ): Promise<void> {
    await invokeWorkerAsync(await getWorkerAsync(), 'importAssetDatabase', {
      databasePath,
      assetDatabasePath,
      forceOverwrite,
    });
  }

  readonly NativeDatabase: typeof NativeDatabase = NativeDatabase;
  readonly NativeStatement: typeof NativeStatement = NativeStatement;
  readonly NativeSession: typeof NativeSession = NativeSession;
}

const sqliteModuleName = 'SQLiteModule';
// A second evaluation returns the instance that already owns the worker.
// Scheduling again would start a worker that instance never uses.
const moduleAlreadyRegistered = globalThis.expo?.modules?.[sqliteModuleName] != null;
const SQLiteModuleInstance = registerWebModule(SQLiteModule, sqliteModuleName);
if (!moduleAlreadyRegistered) {
  cancelScheduledWorkerStart();
  scheduleWorkerStart();
}
export default SQLiteModuleInstance;
