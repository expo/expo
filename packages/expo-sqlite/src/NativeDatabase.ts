import { NativeStatement } from './NativeStatement';

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

  //#endregion

  //#region Synchronous API

  public initSync(): void;
  public isInTransactionSync(): boolean;
  public closeSync(): void;
  public execSync(source: string): void;
  public serializeSync(databaseName: string): Uint8Array;
  public prepareSync(nativeStatement: NativeStatement, source: string): NativeStatement;

  //#endregion

  public syncLibSQL(): Promise<void>;
}

/**
 * Options for opening a database.
 */
export interface SQLiteOpenOptions {
  /**
   * Whether to enable the CR-SQLite extension.
   * @default false
   * @deprecated CR-SQLite is no longer actively maintained. Its support is deprecated in SDK 52, and the option will be removed in SDK 53.
   */
  enableCRSQLite?: boolean;

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
   * Options for libSQL integration.
   */
  libSQLOptions?: {
    /** The URL of the libSQL server. */
    url: string;

    /** The auth token for the libSQL server. */
    authToken: string;

    /**
     * Whether to use remote-only without syncing to local database.
     * @default false
     */
    remoteOnly?: boolean;
  };
}

type FlattenedOpenOptions = Omit<SQLiteOpenOptions, 'libSQLOptions'> & {
  libSQLUrl?: string;
  libSQLAuthToken?: string;
  libSQLRemoteOnly?: boolean;
};

/**
 * Flattens the SQLiteOpenOptions that are passed to the native module.
 */
export function flattenOpenOptions(options: SQLiteOpenOptions): FlattenedOpenOptions {
  const { libSQLOptions, ...restOptions } = options;
  const result: FlattenedOpenOptions = {
    ...restOptions,
  };
  if (libSQLOptions) {
    Object.assign(result, {
      libSQLUrl: libSQLOptions.url,
      libSQLAuthToken: libSQLOptions.authToken,
      libSQLRemoteOnly: libSQLOptions.remoteOnly,
    });
  }
  return result;
}
