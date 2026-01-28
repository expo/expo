/**
 * A type that represents a changeset.
 */
export type Changeset = Uint8Array;
type NativeChangeset = ArrayBuffer;

export type SQLiteAnyDatabase = any;

export declare class NativeSession {
  //#region Asynchronous API

  public attachAsync(database: SQLiteAnyDatabase, table: string | null): Promise<void>;
  public enableAsync(database: SQLiteAnyDatabase, enabled: boolean): Promise<void>;
  public closeAsync(database: SQLiteAnyDatabase): Promise<void>;

  public createChangesetAsync(database: SQLiteAnyDatabase): Promise<NativeChangeset>;
  public createInvertedChangesetAsync(database: SQLiteAnyDatabase): Promise<NativeChangeset>;
  public applyChangesetAsync(
    database: SQLiteAnyDatabase,
    changeset: NativeChangeset
  ): Promise<void>;
  public invertChangesetAsync(
    database: SQLiteAnyDatabase,
    changeset: NativeChangeset
  ): Promise<NativeChangeset>;

  //#endregion

  //#region Synchronous API

  public attachSync(database: SQLiteAnyDatabase, table: string | null): void;
  public enableSync(database: SQLiteAnyDatabase, enabled: boolean): void;
  public closeSync(database: SQLiteAnyDatabase): void;

  public createChangesetSync(database: SQLiteAnyDatabase): NativeChangeset;
  public createInvertedChangesetSync(database: SQLiteAnyDatabase): NativeChangeset;
  public applyChangesetSync(database: SQLiteAnyDatabase, changeset: NativeChangeset): void;
  public invertChangesetSync(
    database: SQLiteAnyDatabase,
    changeset: NativeChangeset
  ): NativeChangeset;

  //#endregion
}
