// expo-sqlite is not supported on server runtime, this file contains a dummy implementation for the server runtime

import { registerWebModule, NativeModule } from 'expo';

import { type SQLiteOpenOptions } from '../src/NativeDatabase';
import { type Changeset } from '../src/NativeSession';
import {
  type SQLiteBindBlobParams,
  type SQLiteBindPrimitiveParams,
  type SQLiteColumnNames,
  type SQLiteColumnValues,
  type SQLiteRunResult,
} from '../src/NativeStatement';

class NativeDatabase {
  public readonly id: number = 0;

  constructor(
    public readonly databasePath: string,
    public readonly options?: SQLiteOpenOptions,
    private serializedData?: Uint8Array
  ) {}

  async initAsync(): Promise<void> {}
  initSync(): void {}

  async isInTransactionAsync(): Promise<boolean> {
    return false;
  }
  isInTransactionSync(): boolean {
    return false;
  }

  async closeAsync(): Promise<void> {}
  closeSync(): void {}

  async execAsync(source: string): Promise<void> {}
  execSync(source: string): void {}

  async serializeAsync(schemaName: string): Promise<Uint8Array> {
    return new Uint8Array();
  }
  serializeSync(schemaName: string): Uint8Array {
    return new Uint8Array();
  }

  async prepareAsync(nativeStatement: NativeStatement, source: string): Promise<void> {}
  prepareSync(nativeStatement: NativeStatement, source: string): void {}
  async createSessionAsync(nativeSession: NativeSession, dbName: string): Promise<void> {}
  createSessionSync(nativeSession: NativeSession, dbName: string): void {}
  async loadExtensionAsync(filePath: string, entryPoint?: string): Promise<void> {}
  loadExtensionSync(filePath: string, entryPoint?: string): void {}
}

class NativeStatement {
  public readonly id: number = 0;

  async runAsync(
    database: NativeDatabase,
    bindParams: SQLiteBindPrimitiveParams,
    bindBlobParams: SQLiteBindBlobParams,
    shouldPassAsArray: boolean
  ): Promise<SQLiteRunResult & { firstRowValues: SQLiteColumnValues }> {
    return {
      lastInsertRowId: 0,
      changes: 0,
      firstRowValues: [],
    };
  }
  runSync(
    database: NativeDatabase,
    bindParams: SQLiteBindPrimitiveParams,
    bindBlobParams: SQLiteBindBlobParams,
    shouldPassAsArray: boolean
  ): SQLiteRunResult & { firstRowValues: SQLiteColumnValues } {
    return {
      lastInsertRowId: 0,
      changes: 0,
      firstRowValues: [],
    };
  }

  async stepAsync(database: NativeDatabase): Promise<SQLiteColumnValues | null> {
    return null;
  }
  stepSync(database: NativeDatabase): SQLiteColumnValues | null {
    return null;
  }

  async getAllAsync(database: NativeDatabase): Promise<SQLiteColumnValues[]> {
    return [];
  }
  getAllSync(database: NativeDatabase): SQLiteColumnValues[] {
    return [];
  }

  async resetAsync(database: NativeDatabase): Promise<void> {}
  resetSync(database: NativeDatabase): void {}

  async getColumnNamesAsync(): Promise<SQLiteColumnNames> {
    return [];
  }
  getColumnNamesSync(): SQLiteColumnNames {
    return [];
  }

  async finalizeAsync(database: NativeDatabase): Promise<void> {}
  finalizeSync(database: NativeDatabase): void {}
}

export class NativeSession {
  public readonly id: number = 0;

  async attachAsync(database: NativeDatabase, table: string | null): Promise<void> {}
  attachSync(database: NativeDatabase, table: string | null): void {}

  async enableAsync(database: NativeDatabase, enabled: boolean): Promise<void> {}
  enableSync(database: NativeDatabase, enabled: boolean): void {}

  async closeAsync(database: NativeDatabase): Promise<void> {}
  closeSync(database: NativeDatabase): void {}

  async createChangesetAsync(database: NativeDatabase): Promise<Changeset> {
    return new Uint8Array();
  }
  createChangesetSync(database: NativeDatabase): Changeset {
    return new Uint8Array();
  }

  async createInvertedChangesetAsync(database: NativeDatabase): Promise<Changeset> {
    return new Uint8Array();
  }
  createInvertedChangesetSync(database: NativeDatabase): Changeset {
    return new Uint8Array();
  }

  async applyChangesetAsync(database: NativeDatabase, changeset: Changeset): Promise<void> {}
  applyChangesetSync(database: NativeDatabase, changeset: Changeset): void {}

  async invertChangesetAsync(database: NativeDatabase, changeset: Changeset): Promise<Changeset> {
    return new Uint8Array();
  }
  invertChangesetSync(database: NativeDatabase, changeset: Changeset): Changeset {
    return new Uint8Array();
  }
}

export class SQLiteModule extends NativeModule {
  readonly defaultDatabaseDirectory = '.';
  readonly bundledExtensions = {};

  async deleteDatabaseAsync(databasePath: string): Promise<void> {}
  deleteDatabaseSync(databasePath: string): void {}

  async ensureDatabasePathExistsAsync(databasePath: string): Promise<void> {}
  ensureDatabasePathExistsSync(databasePath: string): void {}

  async backupDatabaseAsync(
    destDatabase: NativeDatabase,
    destDatabaseName: string,
    sourceDatabase: NativeDatabase,
    sourceDatabaseName: string
  ): Promise<void> {}
  backupDatabaseSync(
    destDatabase: NativeDatabase,
    destDatabaseName: string,
    sourceDatabase: NativeDatabase,
    sourceDatabaseName: string
  ): void {}

  async importAssetDatabaseAsync(
    databasePath: string,
    assetDatabasePath: string,
    forceOverwrite: boolean
  ): Promise<void> {}

  readonly NativeDatabase: typeof NativeDatabase = NativeDatabase;
  readonly NativeStatement: typeof NativeStatement = NativeStatement;
  readonly NativeSession: typeof NativeSession = NativeSession;
}

const SQLiteModuleInstance = registerWebModule(SQLiteModule, 'SQLiteModule');
export default SQLiteModuleInstance;
