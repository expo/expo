// Copyright 2015-present 650 Industries. All rights reserved.

import { registerWebModule, NativeModule } from 'expo';

import { invokeWorkerAsync, invokeWorkerSync, workerMessageHandler } from './WorkerChannel';
import { type SQLiteOpenOptions } from '../src/NativeDatabase';
import { type Changeset } from '../src/NativeSession';
import {
  type SQLiteBindBlobParams,
  type SQLiteBindPrimitiveParams,
  type SQLiteColumnNames,
  type SQLiteColumnValues,
  type SQLiteRunResult,
} from '../src/NativeStatement';

let worker: Worker | null = null;
let nextNativeDatabaseId = 0;
let nextNativeStatementId = 0;
let nextNativeSessionId = 0;

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('./worker', window.location.href));
    worker.addEventListener('message', (event) => {
      if (event.data.type === 'onDatabaseChange') {
        // @ts-expect-error EventEmitter type for NativeModule is not inferred correctly on web.
        SQLiteModuleInstance.emit(event.data.type, event.data.data);
        return;
      }
      workerMessageHandler(event);
    });
  }
  return worker;
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
    await invokeWorkerAsync(getWorker(), 'open', {
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
    return await invokeWorkerAsync(getWorker(), 'isInTransaction', {
      nativeDatabaseId: this.id,
    });
  }
  isInTransactionSync(): boolean {
    return invokeWorkerSync(getWorker(), 'isInTransaction', {
      nativeDatabaseId: this.id,
    });
  }

  async closeAsync(): Promise<void> {
    await invokeWorkerAsync(getWorker(), 'close', {
      nativeDatabaseId: this.id,
    });
  }
  closeSync(): void {
    invokeWorkerSync(getWorker(), 'close', {
      nativeDatabaseId: this.id,
    });
  }

  async execAsync(source: string): Promise<void> {
    await invokeWorkerAsync(getWorker(), 'exec', {
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
    return await invokeWorkerAsync(getWorker(), 'serialize', {
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
    await invokeWorkerAsync(getWorker(), 'prepare', {
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
    await invokeWorkerAsync(getWorker(), 'sessionCreate', {
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
    return await invokeWorkerAsync(getWorker(), 'run', {
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
    return await invokeWorkerAsync(getWorker(), 'step', {
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
    return await invokeWorkerAsync(getWorker(), 'getAll', {
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
    await invokeWorkerAsync(getWorker(), 'reset', {
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
    return await invokeWorkerAsync(getWorker(), 'getColumnNames', {
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
    await invokeWorkerAsync(getWorker(), 'finalize', {
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
    await invokeWorkerAsync(getWorker(), 'sessionAttach', {
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
    await invokeWorkerAsync(getWorker(), 'sessionEnable', {
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
    await invokeWorkerAsync(getWorker(), 'sessionClose', {
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

  async createChangesetAsync(database: NativeDatabase): Promise<Changeset> {
    return await invokeWorkerAsync(getWorker(), 'sessionCreateChangeset', {
      nativeDatabaseId: database.id,
      nativeSessionId: this.id,
    });
  }
  createChangesetSync(database: NativeDatabase): Changeset {
    return invokeWorkerSync(getWorker(), 'sessionCreateChangeset', {
      nativeDatabaseId: database.id,
      nativeSessionId: this.id,
    });
  }

  async createInvertedChangesetAsync(database: NativeDatabase): Promise<Changeset> {
    return await invokeWorkerAsync(getWorker(), 'sessionCreateInvertedChangeset', {
      nativeDatabaseId: database.id,
      nativeSessionId: this.id,
    });
  }
  createInvertedChangesetSync(database: NativeDatabase): Changeset {
    return invokeWorkerSync(getWorker(), 'sessionCreateInvertedChangeset', {
      nativeDatabaseId: database.id,
      nativeSessionId: this.id,
    });
  }

  async applyChangesetAsync(database: NativeDatabase, changeset: Changeset): Promise<void> {
    await invokeWorkerAsync(getWorker(), 'sessionApplyChangeset', {
      nativeDatabaseId: database.id,
      nativeSessionId: this.id,
      changeset,
    });
  }
  applyChangesetSync(database: NativeDatabase, changeset: Changeset): void {
    invokeWorkerSync(getWorker(), 'sessionApplyChangeset', {
      nativeDatabaseId: database.id,
      nativeSessionId: this.id,
      changeset,
    });
  }

  async invertChangesetAsync(database: NativeDatabase, changeset: Changeset): Promise<Changeset> {
    return await invokeWorkerAsync(getWorker(), 'sessionInvertChangeset', {
      nativeDatabaseId: database.id,
      nativeSessionId: this.id,
      changeset,
    });
  }
  invertChangesetSync(database: NativeDatabase, changeset: Changeset): Changeset {
    return invokeWorkerSync(getWorker(), 'sessionInvertChangeset', {
      nativeDatabaseId: database.id,
      nativeSessionId: this.id,
      changeset,
    });
  }
}

export class SQLiteModule extends NativeModule {
  readonly defaultDatabaseDirectory = '.';

  async deleteDatabaseAsync(databasePath: string): Promise<void> {
    await invokeWorkerAsync(getWorker(), 'deleteDatabase', {
      databasePath,
    });
  }
  deleteDatabaseSync(databasePath: string): void {
    invokeWorkerSync(getWorker(), 'deleteDatabase', {
      databasePath,
    });
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
    await invokeWorkerAsync(getWorker(), 'backupDatabase', {
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
    await invokeWorkerAsync(getWorker(), 'importAssetDatabase', {
      databasePath,
      assetDatabasePath,
      forceOverwrite,
    });
  }

  readonly NativeDatabase: typeof NativeDatabase = NativeDatabase;
  readonly NativeStatement: typeof NativeStatement = NativeStatement;
  readonly NativeSession: typeof NativeSession = NativeSession;
}

const SQLiteModuleInstance = registerWebModule(SQLiteModule, 'SQLiteModule');
export default SQLiteModuleInstance;
