import { NativeStatement } from './NativeStatement';

/**
 * A class that represents an instance of the SQLite database.
 */
export declare class NativeDatabase {
  constructor(dbName: string, options?: OpenOptions);

  //#region Asynchronous API

  public initAsync(): Promise<void>;
  public isInTransactionAsync(): Promise<boolean>;
  public closeAsync(): Promise<void>;
  public execAsync(source: string): Promise<void>;
  public prepareAsync(nativeStatement: NativeStatement, source: string): Promise<NativeStatement>;

  //#endregion

  //#region Synchronous API

  public initSync(): void;
  public isInTransactionSync(): boolean;
  public closeSync(): void;
  public execSync(source: string): void;
  public prepareSync(nativeStatement: NativeStatement, source: string): NativeStatement;

  //#endregion
}

/**
 * Options for opening a database.
 */
export interface OpenOptions {
  /**
   * Whether to enable the CR-SQLite extension.
   * @default false
   */
  enableCRSQLite?: boolean;

  /**
   * Whether to call the `sqlite3_update_hook` function and enable the `onDatabaseChange` events.
   * @default false
   */
  enableChangeListener?: boolean;

  /**
   * Whether to create new connection even if connection with the same database name exists in cache.
   * @default false
   */
  useNewConnection?: boolean;
}
