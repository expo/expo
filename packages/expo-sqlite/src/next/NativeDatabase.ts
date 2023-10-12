import { NativeStatement } from './NativeStatement';

/**
 * A class that represents an instance of the SQLite database.
 */
export declare class NativeDatabase {
  constructor(dbName: string, options?: OpenOptions);

  public initAsync(): Promise<void>;
  public isInTransaction(): boolean;
  public isInTransactionAsync(): Promise<boolean>;
  public closeAsync(): Promise<void>;
  public execAsync(source: string): Promise<void>;
  public prepareAsync(nativeStatement: NativeStatement, source: string): Promise<NativeStatement>;
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
}
