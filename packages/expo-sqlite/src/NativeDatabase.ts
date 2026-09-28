import type { NativeSession } from './NativeSession';
import type { NativeStatement } from './NativeStatement';

/**
 * A class that represents an instance of the SQLite database.
 */
export declare class NativeDatabase {
  constructor(databasePath: string, options?: SQLiteOpenOptions, serializedData?: Uint8Array);

  //#region Asynchronous API

  public initAsync(): Promise<void>;
  public isInTransactionAsync(): Promise<boolean>;
  public closeAsync(): Promise<void>;
  public execAsync(source: string): Promise<void>;
  public serializeAsync(databaseName: string): Promise<Uint8Array>;
  public prepareAsync(nativeStatement: NativeStatement, source: string): Promise<NativeStatement>;
  public createSessionAsync(nativeSession: NativeSession, dbName: string): Promise<NativeSession>;
  public loadExtensionAsync(libPath: string, entryPoint?: string): Promise<void>;

  //#endregion

  //#region Synchronous API

  public initSync(): void;
  public isInTransactionSync(): boolean;
  public closeSync(): void;
  public interruptSync(): void;
  public execSync(source: string): void;
  public serializeSync(databaseName: string): Uint8Array;
  public prepareSync(nativeStatement: NativeStatement, source: string): NativeStatement;
  public createSessionSync(nativeSession: NativeSession, dbName: string): NativeSession;
  public loadExtensionSync(libPath: string, entryPoint?: string): void;

  //#endregion
}

/**
 * Options for opening a database.
 */
export interface SQLiteOpenOptions {
  /**
   * Whether to call the [`sqlite3_update_hook()`](https://www.sqlite.org/c3ref/update_hook.html) function and enable the `onDatabaseChange` events. You can later subscribe to the change events by [`addDatabaseChangeListener`](#sqliteadddatabasechangelistenerlistener).
   * @default false
   */
  enableChangeListener?: boolean;

  /**
   * Whether to create new connection even if connection with the same database name exists in cache.
   * @default false
   */
  useNewConnection?: boolean;

  /**
   * Finalized unclosed statements automatically when the database is closed.
   * @default true
   * @hidden
   */
  finalizeUnusedStatementsBeforeClosing?: boolean;

  /**
   * Whether to store the database in a way that allows the same database to be opened from more
   * than one browser tab or worker at a time. Without it, opening a second tab fails with
   * `NoModificationAllowedError`, because the default web storage backend holds an exclusive
   * OPFS access handle for the whole origin.
   *
   * > **warning** This option changes how the database is laid out in OPFS. Opening an existing
   * > database with a different `enableMultiTabSupport` value creates a new, empty database
   * > instead of reading the existing one.
   *
   * Opening a database is slower with this option, and so is accessing it from several tabs at the
   * same time. A transaction cannot access more than one database, such as the main database and
   * an attached database.
   *
   * @default false
   * @platform web
   */
  enableMultiTabSupport?: boolean;
}
